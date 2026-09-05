# API de Consulta de CEP

API NestJS para consulta de CEP usando ViaCEP e BrasilAPI. A aplicação possui cache Redis, fallback entre providers, timeout por tentativa, validação das respostas externas com Zod e logs estruturados da requisição.

## Índice

- [Visão geral](#visão-geral)
- [Como executar](#como-executar)
- [Uso da API](#uso-da-api)
- [Arquitetura](#arquitetura)
- [Design patterns](#design-patterns)
- [Tratamento de erros](#tratamento-de-erros)
- [Decisões e trade-offs](#decisões-e-trade-offs)
- [Testes](#testes)
- [Estrutura de pastas](#estrutura-de-pastas)

## Visão geral

O endpoint `GET /cep/:cep` consulta um CEP em duas fontes externas:

- ViaCEP
- BrasilAPI

O fluxo usa Redis como cache de leitura. Quando há um valor cacheado, ele é retornado sem chamar as APIs externas. Em caso de cache miss, os providers são consultados na ordem definida pela estratégia round-robin. Se um provider falhar, o próximo é tentado.

Todos os providers retornam o mesmo contrato interno:

```json
{
  "cep": "01310000",
  "logradouro": "Avenida Paulista",
  "bairro": "Bela Vista",
  "cidade": "São Paulo",
  "uf": "SP"
}
```

## Como executar

### Pré-requisitos

- Node.js 18 ou superior
- Docker e Docker Compose

### Instalação

```bash
npm install
docker compose up -d
cp .env.example .env
npm run start:dev
```

A API fica disponível em `http://localhost:3000`.

No Windows PowerShell, o arquivo `.env.example` pode ser copiado com:

```powershell
Copy-Item .env.example .env
```

### Variáveis de ambiente

```env
REDIS_HOST=localhost
REDIS_PORT=6379
```

O `PORT` também pode ser definido para alterar a porta HTTP; quando não informado, a aplicação usa `3000`.

## Uso da API

```bash
curl http://localhost:3000/cep/01310000
```

O parâmetro aceita números ou uma representação formatada, porque a pipe remove caracteres não numéricos antes de validar. O valor normalizado precisa ter exatamente oito dígitos.

## Arquitetura

### Fluxo de uma consulta

```text
GET /cep/:cep
    |
    v
CepValidationPipe
    |
    v
CepController + LoggingInterceptor
    |
    v
CepService.findByCep
    |
    +--> Redis cache hit ----------------------> retorna o resultado
    |
    +--> cache miss
           |
           v
    ProviderOrderStrategy (round-robin)
           |
           +--> ViaCepProvider   --+
           |                       |
           +--> BrasilApiProvider -+--> TimeoutResolutionStrategy
                                           |
                                  sucesso -> grava no Redis e retorna
                                  falha   -> tenta o próximo provider
```

O timeout é de 3 segundos por tentativa. O resultado de uma consulta bem-sucedida é gravado no Redis com TTL de 30 dias.

### Camadas principais

- `CepValidationPipe`: normaliza e valida o CEP antes da consulta.
- `CepController`: expõe a rota HTTP e aplica o interceptor de logging.
- `CepService`: coordena cache, ordem dos providers, fallback e classificação do erro final.
- `ICepProvider`: contrato comum para fontes de dados de CEP.
- `TimeoutResolutionStrategy`: executa uma tentativa com timeout e registra o resultado.
- `RoundRobinProviderOrderStrategy`: define a ordem dos providers em cada requisição.
- `AppExceptionFilter`: converte exceções em respostas HTTP padronizadas.

## Design patterns

### Strategy: resolução de uma tentativa

`ICepResolutionStrategy` define como um provider deve ser consultado:

```typescript
interface ICepResolutionStrategy {
  resolve(cep: string, provider: ICepProvider): Promise<CepResult>;
}
```

`TimeoutResolutionStrategy` é a implementação atual. Ela aplica o timeout de 3 segundos, limpa o timer quando a operação termina e propaga o erro original para que o serviço possa decidir o fallback.

Essa separação permite adicionar outra forma de resolução, como retry ou circuit breaker, sem colocar essa lógica dentro do `CepService`.

### Strategy: ordenação dos providers

`IProviderOrderStrategy` define como a lista de providers será ordenada. `RoundRobinProviderOrderStrategy` alterna o provider inicial entre as requisições:

```text
requisição 1: ViaCEP -> BrasilAPI
requisição 2: BrasilAPI -> ViaCEP
requisição 3: ViaCEP -> BrasilAPI
```

O `CepService` não conhece a regra de ordenação; ele apenas solicita uma ordem à estratégia injetada.

### Factory: montagem dos providers

O `CepModule` usa a `useFactory` do NestJS para montar o token `CEP_PROVIDERS`:

```typescript
{
  provide: CEP_PROVIDERS,
  useFactory: (viaCep, brasilApi) => [viaCep, brasilApi],
  inject: [ViaCepProvider, BrasilApiProvider],
}
```

Essa Factory concentra a composição das fontes disponíveis. Para adicionar outro provider, é necessário registrá-lo no módulo e incluí-lo nessa Factory; o `CepService` continua dependendo apenas de `ICepProvider[]`.

### Abstração de providers

ViaCEP e BrasilAPI implementam `ICepProvider` e convertem seus formatos externos para `CepResult`. Cada integração tem seu próprio schema Zod, evitando que diferenças como `localidade` e `city` vazem para o restante da aplicação.

## Tratamento de erros

Cada tentativa pode falhar por timeout, indisponibilidade, resposta inválida ou CEP não encontrado. O serviço continua tentando os providers restantes.

### Respostas finais

- `404 CEP_NOT_FOUND`: todos os providers consultados retornaram `CepNotFoundException`.
- `503 CEP_ALL_PROVIDERS_DOWN`: nenhum provider resolveu a consulta e pelo menos uma falha não foi “CEP não encontrado”. A resposta inclui os motivos registrados nas tentativas.
- `400 Bad Request`: o CEP não possui oito dígitos após a normalização feita pela pipe.
- `500 INTERNAL_ERROR`: falha não classificada pelo filtro global.

As exceções de timeout, indisponibilidade e resposta inválida são internas ao fluxo de fallback e não são expostas diretamente como resposta HTTP.

### Formato de erro

O filtro global retorna:

```json
{
  "timestamp": "2026-09-05T12:00:00.000Z",
  "path": "/cep/00000000",
  "message": "CEP 00000000 não encontrado",
  "errorCode": "CEP_NOT_FOUND"
}
```

## Decisões e trade-offs

### Cache Redis com TTL de 30 dias

O cache usa Redis e grava o resultado somente depois de uma consulta bem-sucedida. O TTL é de 30 dias porque um CEP raramente altera seus dados de endereço em um intervalo curto. Esse período reduz chamadas externas repetidas e mantém o dado suficientemente atual para o objetivo da aplicação.

O cache é consultado antes dos providers. Portanto, o sistema não implementa um fallback para cache depois que todas as APIs falham: cache hit evita a chamada externa desde o início, enquanto cache miss segue para os providers.

### Fallback também para “não encontrado”

Um provider pode não reconhecer um CEP que outro provider conhece. Por isso, `CepNotFoundException` não encerra a busca imediatamente. O próximo provider é sempre tentado, e o `404` só é produzido quando todos retornam “não encontrado”.

### Round-robin simples

A alternância distribui o provider inicial entre as requisições e evita que uma única API seja sempre consultada primeiro. O estado da estratégia existe em memória no processo atual; não há coordenação entre múltiplas instâncias da aplicação.

### Validação da resposta externa

Cada integração valida a resposta com Zod antes do mapeamento. Uma resposta incompatível aciona o fallback como erro de provider.

### Sem retry, circuit breaker ou fila

Esses mecanismos não fazem parte da implementação atual. O fluxo é síncrono e limitado às tentativas configuradas dos providers, o que mantém o escopo adequado para uma consulta simples.

## Testes

Os testes estão em `src/modules/cep/test` e cobrem 10 casos em 3 suites:

- fallback quando o primeiro provider falha;
- fallback quando um provider retorna “não encontrado”;
- `404` somente quando todos retornam “não encontrado”;
- erro misto de “não encontrado” e indisponibilidade resultando em `503`;
- fallback após timeout;
- `AllProvidersUnavailableException` quando todos falham por infraestrutura;
- retorno da `RoundRobinProviderOrderStrategy` em ordens alternadas;
- sucesso da `TimeoutResolutionStrategy`;
- timeout de uma tentativa pendente;
- propagação do erro original do provider.

Executar a suíte:

```bash
npm test
```

Com cobertura:

```bash
npm run test:cov
```

Compilar o projeto:

```bash
npm run build
```

## Estrutura de pastas

```text
src/
├── common/
│   ├── exeptions/
│   │   ├── app.exeption.ts
│   │   └── exeptions.ts
│   ├── filters/
│   │   └── app-exeption.filter.ts
│   ├── http/
│   │   └── http-client.service.ts
│   └── interceptors/
│       └── logging.interceptor.ts
└── modules/
    └── cep/
        ├── cep.controller.ts
        ├── cep.module.ts
        ├── cep.service.ts
        ├── entities/
        │   └── cep.entity.ts
        ├── interfaces/
        │   ├── Icep.provider.ts
        │   └── cep-result.interface.ts
        ├── intergrations/
        │   ├── cep-providers.tokens.ts
        │   ├── brasilapi/
        │   └── viacep/
        ├── pipe/
        │   └── cep-validation.pipe.ts
        ├── strategies/
        │   ├── interfaces/
        │   ├── provider-order.tokens.ts
        │   ├── resolution-strategy.tokens.ts
        │   ├── round-robin-provider-order.strategy.ts
        │   └── timeout-resolution.strategy.ts
        └── test/
            ├── cep.service.spec.ts
            ├── round-robin-provider-order.strategy.spec.ts
            └── timeout-resolution.strategy.spec.ts
```
