import {
    Service
} from "@cmmv/core";

import {
    Repository
} from "@cmmv/repository";

/**
 * Service compartilhado para operações relacionadas a usuários
 * Centraliza a lógica de busca de nome de exibição para garantir consistência
 */
@Service()
export class UsersService {
    /**
     * Obter NOME de exibição do usuário a partir do ID
     *
     * Ordem de prioridade:
     * 1. ProfilesEntity.name (nome real configurado no perfil)
     * 2. UserEntity.name / username / email
     * 3. Fallback para o próprio userId
     *
     * @param userId - ID do usuário (pode ser string ou número)
     * @returns Nome de exibição do usuário (sempre string)
     */
    async getUserName(userId: string): Promise<string> {
        try {
            console.log(`[UsersService] Buscando NOME do usuário: ${userId} (tipo: ${typeof userId})`);

            // Se for 'system', retornar diretamente
            if (userId === 'system' || userId === 'System' || userId === 'SYSTEM') {
                console.log(`[UsersService] ⚠️ userId é 'system', retornando 'Sistema'`);
                return 'Sistema';
            }

            // Converter userId para número se necessário (alguns sistemas usam number)
            const userIdNumber = !isNaN(Number(userId)) ? Number(userId) : null;

            /**
             * 1) TENTAR PRIMEIRO NO PERFIL (onde geralmente está o nome real)
             */
            try {
                const ProfilesEntity = Repository.getEntity("ProfilesEntity");

                // Tentar buscar com o campo "user" (como string)
                let profile = await Repository.findOne(ProfilesEntity, { user: userId });

                // Se não encontrou e userId pode ser número, tentar como número
                if (!profile && userIdNumber !== null) {
                    profile = await Repository.findOne(ProfilesEntity, { user: userIdNumber });
                }

                if (profile) {
                    const anyProfile: any = profile as any;
                    console.log(`[UsersService] ✅ Perfil encontrado para ${userId}:`, {
                        id: anyProfile.id,
                        name: anyProfile.name,
                        user: anyProfile.user,
                        email: anyProfile.email
                    });

                    // Tentar pegar o nome do perfil
                    const profileName = anyProfile.name || anyProfile.fullName;
                    if (profileName && typeof profileName === 'string') {
                        console.log(`[UsersService] ✅ Nome retornado do perfil: ${profileName}`);
                        return String(profileName);
                    }

                    // Como fallback dentro do perfil, se tiver email, pode usar
                    if (anyProfile.email && typeof anyProfile.email === 'string') {
                        console.log(`[UsersService] ⚠️ Perfil sem nome, usando email do perfil: ${anyProfile.email}`);
                        return String(anyProfile.email);
                    }
                } else {
                    console.log(`[UsersService] ⚠️ Nenhum perfil encontrado para ${userId}`);
                }
            } catch (profileError) {
                console.error(`[UsersService] ❌ Erro ao buscar perfil do usuário ${userId}:`, profileError);
            }

            /**
             * 2) SE NÃO ENCONTROU NO PERFIL, BUSCAR NA ENTIDADE User
             */
            try {
                const UserEntity = Repository.getEntity("UserEntity");
                let user = await Repository.findOne(UserEntity, { id: userId });

                // Se não encontrou e userId pode ser número, tentar como número
                if (!user && userIdNumber !== null) {
                    user = await Repository.findOne(UserEntity, { id: userIdNumber });
                }

                if (user) {
                    const anyUser: any = user as any;
                    console.log(`[UsersService] ✅ Usuário encontrado:`, {
                        id: anyUser.id,
                        name: anyUser.name,
                        username: anyUser.username,
                        email: anyUser.email
                    });

                    // Tentar obter nome de diferentes campos possíveis
                    const displayName =
                        anyUser.name ||
                        anyUser.username ||
                        anyUser.email ||
                        userId;

                    console.log(`[UsersService] ✅ Nome retornado do usuário: ${displayName}`);
                    return String(displayName);
                } else {
                    console.log(`[UsersService] ⚠️ Usuário não encontrado para ${userId}`);
                }
            } catch (userError) {
                console.error(`[UsersService] ❌ Erro ao buscar usuário ${userId}:`, userError);
            }
        } catch (error) {
            console.error(`[UsersService] ❌ Erro geral ao buscar NOME do usuário ${userId}:`, error);
        }

        console.log(`[UsersService] ⚠️ Retornando userId como fallback: ${userId}`);
        // Garantir que sempre retorne uma string
        return String(userId || 'unknown');
    }
}

