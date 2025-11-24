import { Module } from '@cmmv/core';

import {
    UsersService
} from "./users.service";

export const SasUsersModule = new Module('sas-users', {
    providers: [UsersService],
    exports: [UsersService] // Exportar para que outros módulos possam usar
});

