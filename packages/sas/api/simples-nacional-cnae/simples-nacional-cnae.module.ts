import { Module } from '@cmmv/core';
import { SimplesNacionalCnaeController } from './simples-nacional-cnae.controller';

export const SasSimplesNacionalCnaeModule = new Module('sas-simples-nacional-cnae', {
    providers: [],
    controllers: [SimplesNacionalCnaeController]
});
