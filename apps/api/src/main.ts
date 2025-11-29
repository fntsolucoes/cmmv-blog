import "./config";

import { Application, EventsService } from "@cmmv/core";
import { AuthModule } from "@cmmv/auth";
import { DefaultAdapter, DefaultHTTPModule } from "@cmmv/http";
import { RepositoryModule, Repository } from "@cmmv/repository";
import { BlogModule } from "@cmmv/blog";
import { AccessControlModule } from "@cmmv/access-control";
import { RSSAggregationModule } from "@cmmv/rss-aggregation";
import { YTAggregationModule } from "@cmmv/yt-aggregation";
import { AIContentModule } from "@cmmv/ai-content";
import { AffiliateModule } from "@cmmv/affiliate";
import { OddsModule } from "@cmmv/odds";
import { NewsletterModule } from "@cmmv/newsletter";
import { SasModule } from "@cmmv/sas";

// Executar migrações SQL antes de inicializar a aplicação
(async function bootstrap() {
    try {
        // Importar e executar migrações apenas se não estiver em modo de teste
        if (process.env.NODE_ENV !== 'test' && !process.env.SKIP_MIGRATIONS) {
            const { runMigrations } = await import('./scripts/run-migrations');
            await runMigrations();
        }
    } catch (error) {
        // Não bloquear a inicialização se houver erro nas migrações
        console.warn('⚠️  Aviso: Erro ao executar migrações (continuando inicialização):', error);
    }

    // Inicializar aplicação após migrações
    Application.create({
    httpAdapter: DefaultAdapter,
    modules: [
        DefaultHTTPModule,
        RepositoryModule,
        AuthModule,
        BlogModule,
        AccessControlModule,
        RSSAggregationModule,
        YTAggregationModule,
        AIContentModule,
        AffiliateModule,
        OddsModule,
        NewsletterModule,
        SasModule
    ],
    providers: [
        Repository,
        EventsService
    ]
    });
})();
