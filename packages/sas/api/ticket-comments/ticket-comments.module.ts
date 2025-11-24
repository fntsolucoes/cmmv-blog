import { Module } from '@cmmv/core';

import {
    TicketCommentsService
} from "./ticket-comments.service";

import {
    TicketCommentsController
} from "./ticket-comments.controller";

import { SasUsersModule } from '../users/users.module';

export const SasTicketCommentsModule = new Module('sas-ticket-comments', {
    providers: [TicketCommentsService],
    controllers: [TicketCommentsController],
    imports: [SasUsersModule] // Importar módulo de usuários para usar UsersService
});

