export * from "./api"
export * from "./admin";
export * from "./client";
export * from "./contracts";

import { SasModule } from "./api/sas.module";

export { SasModule };
import * as admin from "./admin/index";
import * as clients from "./client/index";
import * as contracts from "./contracts/index";

export default {
    name: '@cmmv/sas',
    version: '0.0.1',
    description: 'Sistema de Administração de Saques package for CMMV',
    api: SasModule,
    contracts,
    clients,
    admin,
    dependencies: [
        "@cmmv/http",
        "@cmmv/repository",
        "@cmmv/auth"
    ]
}

