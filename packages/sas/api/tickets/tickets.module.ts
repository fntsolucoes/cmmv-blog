import { Module } from '@cmmv/core';

import {
    TicketsService
} from "./tickets.service";

import {
    TicketsController
} from "./tickets.controller";

import { SasUsersModule } from '../users/users.module';

export const SasTicketsModule = new Module('sas-tickets', {
    providers: [TicketsService],
    controllers: [TicketsController],
    imports: [SasUsersModule] // Importar módulo de usuários para usar UsersService
});

