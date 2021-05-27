# Caruna Visualizer

Visualizes your electricity consumption in Grafana

## Setup

Add your Caruna credentials to .env file, see .env.sample
for assistance. 
```
username=your_caruna_username@something.com
password=yourPasswordToCaruna
```

To create the credentials visit https://authentication2.caruna.fi/portal/login

## Running

1) Run `docker compose up`
2) Go to `localhost:3000`
3) Log in to Grafana with user: `admin` and password: `admin`