# **API de Unidades Organizacionais (Closure Table)**

API REST desenvolvida em **NestJS** e **TypeScript** para gerenciar uma hierarquia de Unidades Organizacionais (usuários e grupos),modelada com **Closure Table** para consultas de alta performance em **PostgreSQL**.

---

## **Focos do Projeto**

* **Elegância de código:** (SOLID, camadas limpas, tipagem forte).
* **Corretude da hierarquia:** (sem ciclos, profundidades mínimas, sem duplicados).
* **Performance de leitura:** via Closure Table.
* **Observabilidade:** logs JSON no ECS (Elastic Common Schema) + OpenTelemetry com spans personalizados.
* **Testes:** unitários/integrados no seu projeto.

---

## **Como Executar o Projeto**

Siga os passos abaixo para executar a aplicação e todas as suas dependências.

### **Pré-requisitos**

* [Docker](https://www.docker.com/get-started/)
* [Docker Compose](https://docs.docker.com/compose/install/)
* [Node.js](https://nodejs.org/)
* [Git](https://git-scm.com/)

1. **Clone o repositório**
   ```bash
   git clone https://github.com/rodrigojsdeveloper/gac-challenge.git
   ```

2. **Configurar as variáveis de ambiente**

Crie `.env` a partir de `.env.example`. Os valores padrão funcionam com o `docker-compose.yaml`.

   ```bash
   cp .env.example .env
   ```

3. **Instalar dependências**
   ```bash
   npm install
   ```

4. **Subir containers**
   ```bash
   npm run dev:up
   ```

5. **Rodar migrations**
   ```bash
   npm run db:migrate
   ```

6. **Iniciar servidor**
   ```bash
   npm run dev
   ```

7. **Acesse a API**
   ```bash
   http://localhost:3000
   ```

---

## **Documentação da API**

A documentação interativa (Swagger/OpenAPI) está disponível em:

**[http://localhost:3000/docs](http://localhost:3000/docs)**

Além disso, métricas de observabilidade compatíveis com Prometheus estão expostas em:

**[http://localhost:3000/metrics](http://localhost:3000/metrics)**

---

## **Gerenciador de Banco**

Uma interface de administração **pgAdmin** está exposta para desenvolvimento:

**[http://localhost:8080](http://localhost:8080)**

Credenciais e detalhes estão no `.env.example`.

---

## **Rodar os testes**

Unitários e integrados.

  ```bash
    npm run test
  ```

---

## **Endpoints principais**

| Método | Rota                       | Descrição |
| :----- | :-------------------------- | :--------- |
| `POST` | `/users`                   | Cria um novo usuário. |
| `POST` | `/groups`                  | Cria um novo grupo, opcionalmente associado a um `parentId`. |
| `POST` | `/users/:id/groups`        | Associa um usuário existente a um grupo (um usuário pode pertencer a N grupos). |
| `GET`  | `/users/:id/organizations` | Lista todos os grupos de um usuário (diretos + herdados), com `depth`. |
| `GET`  | `/nodes/:id/ancestors`     | Lista todos os ancestrais de um nó (usuário ou grupo), com `depth ≥ 1`. |
| `GET`  | `/nodes/:id/descendants`   | Lista todos os descendentes de um nó (usuário ou grupo), com `depth ≥ 1`. |
