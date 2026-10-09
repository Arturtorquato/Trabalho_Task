# Taskly

Gerenciador simples de tarefas em Java 21 e Spring Boot. A aplicação entrega a interface web e a API REST no mesmo serviço, o que permite publicar um único artefato na EC2.

## Executar localmente

Pré-requisitos: JDK 21 ou superior e Maven 3.9 ou superior.

```powershell
mvn spring-boot:run
```

Acesse `http://localhost:8080`. Por padrão, os dados ficam em um banco H2 local no diretório `data/`. As tarefas de demonstração são criadas automaticamente quando o banco está vazio.

## API

| Método | Rota | Ação |
| --- | --- | --- |
| GET | `/api/tasks` | Lista tarefas; aceita `period`, `status` e `q` como filtros |
| POST | `/api/tasks` | Cria uma tarefa |
| PUT | `/api/tasks/{id}` | Atualiza uma tarefa |
| DELETE | `/api/tasks/{id}` | Exclui uma tarefa |

Valores de `period`: `DAILY`, `WEEKLY`, `MONTHLY`. Valores de `priority`: `LOW`, `MEDIUM`, `URGENT`. Valores de `status`: `NOT_STARTED`, `IN_PROGRESS`, `DONE`.

## PostgreSQL no Amazon RDS

Configure estas variáveis no ambiente do processo/container. Não grave credenciais no repositório.

```text
DB_URL=jdbc:postgresql://SEU-ENDPOINT-RDS:5432/taskly
DB_USERNAME=usuario_da_aplicacao
DB_PASSWORD=senha_da_aplicacao
PORT=8080
```

Crie o banco `taskly` no RDS antes de iniciar a aplicação. Na AWS, permita tráfego PostgreSQL (porta 5432) no security group do RDS somente a partir do security group da EC2; não exponha o banco publicamente. Para produção, use AWS Secrets Manager/Parameter Store para fornecer a senha e mantenha o endpoint da aplicação atrás de HTTPS em um load balancer ou proxy reverso.

## Publicar na EC2 com Docker

Instale Docker e Git na instância, clone este repositório e crie uma imagem:

```bash
docker build -t taskly .
docker run -d --name taskly --restart unless-stopped -p 8080:8080 \
  -e DB_URL='jdbc:postgresql://SEU-ENDPOINT-RDS:5432/taskly' \
  -e DB_USERNAME='usuario_da_aplicacao' \
  -e DB_PASSWORD='senha_da_aplicacao' \
  taskly
```

Libere a porta 8080 no security group da EC2 apenas conforme a origem desejada. Para acesso público, prefira terminar TLS em um Application Load Balancer e encaminhar para a porta da aplicação. Em uma implantação real, substitua `ddl-auto: update` por migrações versionadas antes de evoluir o schema.