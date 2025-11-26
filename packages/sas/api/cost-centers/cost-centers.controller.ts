import {
    Controller
} from "@cmmv/http";

import {
    CostCentersService
} from "./cost-centers.service";

@Controller("affiliation-manager/cost-centers")
export class CostCentersController {
    constructor(private readonly costCentersService: CostCentersService){}
    // Métodos do controller serão gerados automaticamente pelo Contract
    // Métodos customizados podem ser adicionados aqui
}











