# Iconik Storage Migrator

Allows for seamless migration of different object types in Iconik to different storage locations.

Simply install the application locally or with [Docker Compose](https://docs.docker.com/compose/), configure the settings to your liking, and watch it go with the included dashboard!

## Features

- Proxy migration
- Concurrency
- Dry run mode which allows for testing without making changes
- Easily deployable through Docker

## Installation

**_Note: Certain project settings must be configured before it can be ran_**

### Local

First, clone the repository using [git](https://git-scm.com/) and then use [npm](https://www.npmjs.com/) to install the necessary node modules. If [Node.js](https://nodejs.org/) is not already installed, please do so before running npm.

```bash
# Clone the repository
git clone https://github.com/bootsie123/iconik-storage-migrator.git

# Enter the directory
cd iconik-storage-migrator

# Install the dependencies
npm install

# Copy example .env file
cp .example.env .env

# Configure the required environment variables
nano .env
```

### Docker

Alternatively, you can install and configure the application with [Docker Compose](https://docs.docker.com/compose/).

```bash
# Clone the repository
git clone https://github.com/bootsie123/iconik-storage-migrator.git

# Enter the directory
cd iconik-storage-migrator

# Configure the required environment variables
nano docker-compose.yml
```

## Configuration

In order to run the app, the following configuration options must be set in the `.env` file or within `docker-compose.yml`.

| Name           | Type   | Default   | Description                                       |
| -------------- | ------ | --------- | ------------------------------------------------- |
| ICONIK_APP_ID  | String |           | The ID of the Iconik application token to use     |
| ICONIK_TOKEN   | String |           | The token of the Iconik application token to use  |
| NEW_STORAGE_ID | String |           | The ID of the storage location to migrate to      |
| REDIS_HOST\*   | String | localhost | The ip address or correction URL to use for Redis |
| REDIS_PORT\*   | Number | 6379      | The port to use for Redis                         |

_Only needed if specifically running locally_

### Application Settings

The following table shows the various configurations options which can be set and their default values. These settings can be set in the `.env` file (for local deployment) or within `docker-compose.yml` if using Docker Compose.

| Name                | Type    | Default                                      | Description                                                                                                                                          |
| ------------------- | ------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| ICONIK_APP_ID       | String  |                                              | The ID of the Iconik application token to use                                                                                                        |
| ICONIK_TOKEN        | String  |                                              | The token of the Iconik application token to use                                                                                                     |
| NEW_STORAGE_ID      | String  |                                              | The ID of the storage location to migrate to                                                                                                         |
| REDIS_HOST\*        | String  | `redis` if production, otherwise `localhost` | The ip address or correction URL to use for Redis                                                                                                    |
| REDIS_PORT\*        | Number  | 6379                                         | The port to use for Redis                                                                                                                            |
| ADD_JOBS            | Boolean | true                                         | Set to true if jobs should automatically be generated and added to their respective queues, otherwise if false, only existing jobs will be processed |
| CONCURRENCY         | Number  | 10                                           | The number of concurrent jobs to process per worker                                                                                                  |
| BULLMQ_PORT         | Number  | 3000                                         | The port to use for the dashboard                                                                                                                    |
| BULLMQ_RESET_QUEUES | Boolean | false                                        | Set to true if all queues should be reset and jobs removed on start, false if otherwise                                                              |
| DRY_RUN             | Boolean | `true` if production, otherwise `false`      | Determines whether dry run mode is enabled. In dry run mode, no changes are made and instead logged to the console                                   |

## Usage

### Local

To start the application locally simply run:

```bash
npm run build

npm start
```

This will start the migration and launch a progress dashboard on port `3000` by default. You can connect to it via `http://localhost:3000/status` or through the IP address of your computer `http://192.168.x.x:3000/status`

### Docker

To start the application with Docker, simply run:

```bash
docker compose up -d
```

From there, you can then access the progress dashboard on port `3000` by default of your Docker host. For example: `http://192.168.x.x:3000/status`

#### Logging

To see all logs, simply run:

```bash
docker compose logs -f
```

## Contributing

Pull requests are welcome. Any changes are appreciated!

## License

This project is licensed under the [MIT License](https://choosealicense.com/licenses/mit/)
