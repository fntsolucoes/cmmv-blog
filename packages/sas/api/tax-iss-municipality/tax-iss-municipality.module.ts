import { Module } from '@cmmv/core';
import { TaxIssMunicipalityController } from './tax-iss-municipality.controller';

export const SasTaxIssMunicipalityModule = new Module('sas-tax-iss-municipality', {
    providers: [],
    controllers: [TaxIssMunicipalityController]
});
