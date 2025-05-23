import {
    Service, Cron,
    CronExpression
} from "@cmmv/core";

import {
    Repository, LessThanOrEqual
} from "@cmmv/repository";

@Service('logs')
export class LogsService {
    @Cron(CronExpression.EVERY_5_MINUTES)
    async handleCronLogs() {
        this.deleteOldLogs.call(this);
    }

    /**
     * Deletes all logs older than 7 days
     */
    async deleteOldLogs() {
        const LogsEntity = Repository.getEntity("LogsEntity");

        const result = await Repository.findAll(LogsEntity, {
            timestamp: LessThanOrEqual(Date.now() - 1000 * 60 * 60 * 24 * 1),
            limit: 10000
        }, [], {
            select: ["id"]
        });

        if(result){
            for (const log of result.data)
                await Repository.delete(LogsEntity, log.id);
        }
    }
}
