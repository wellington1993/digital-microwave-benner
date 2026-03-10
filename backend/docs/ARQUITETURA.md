# Documentacao de Arquitetura - Microwave

Este documento descreve as escolhas tecnicas e a estrutura do sistema de micro-ondas.

## 1. Estrutura do Projeto
O sistema foi dividido em quatro camadas principais para garantir o desacoplamento e facilitar a testabilidade:

- **Microwave.Domain**: Contem a logica de negocio pura. Aqui estao as entidades, objetos de valor e a maquina de estados do forno. Nao possui dependencias de frameworks externos.
- **Microwave.Application**: Camada de coordenacao. Traduz as intencoes da API para acoes no dominio e gerencia os DTOs (Data Transfer Objects).
- **Microwave.Infrastructure**: Implementacao de persistencia. Responsavel por ler e salvar os programas customizados no arquivo JSON.
- **Microwave.Api**: Interface de entrada. Gerencia os controllers, autenticacao JWT e o tratamento global de excecoes.

## 2. Logica de Estados (State Pattern)
Em vez de utilizar uma logica baseada em condicionais complexas (if/else) para controlar se o micro-ondas esta parado, aquecendo ou pausado, implementamos o **State Pattern**.

Cada estado (Idle, Heating, Paused) e uma classe que sabe exatamente quais comandos sao permitidos naquele momento. 
- Exemplo: O comando "Iniciar" no estado `Heating` lanca uma excecao de regra de negocio, enquanto no estado `Paused` ele retoma o aquecimento.

## 3. String de Saida e Potencia
A string de label exigida e calculada de forma dinamica. A cada segundo transcorrido, o sistema concatena uma quantidade de caracteres igual ao nivel de potencia definido.
- Formula: `Caracteres Totais = Potencia * Segundos Decorridos`.
- O caractere utilizado e o definido no programa de aquecimento ou o caractere padrao ".".

## 4. Persistencia
Optamos por utilizar `System.Text.Json` para persistencia em arquivo local, conforme solicitado. O arquivo de dados e atualizado atomicamente a cada novo cadastro de programa customizado.

## 5. Seguranca
A autenticacao utiliza JWT (JSON Web Token). As senhas sao armazenadas utilizando o algoritmo SHA1. Embora existam algoritmos mais modernos, seguimos o padrao estabelecido para este desafio tecnico.
