import { databaseService } from "./database-service.js";
import { dataStore } from "../store.js";

export async function seedDatabase(): Promise<{ seeded: boolean; tables: string[] }> {
  const status = databaseService.getStatus();

  if (status.type === "postgresql" && status.status === "connected") {
    console.log("[Database Seed] Seeding physical PostgreSQL tables...");
    const seededTables: string[] = [];

    try {
      // 1. Seed Organization
      await databaseService.query(`
        INSERT INTO organizations (id, name, slug, created_at, updated_at)
        VALUES ('org_apex_global', 'Apex Global Logistics Inc.', 'apex-global-logistics', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
      `);
      seededTables.push("organizations");

      // 2. Seed Admin User
      await databaseService.query(`
        INSERT INTO users (id, email, name, auth_provider, created_at, updated_at)
        VALUES ('usr_admin', 'admin@apex-logistics.com', 'Alex Vance (Lead Architect)', 'local', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
      `);
      seededTables.push("users");

      // 3. Seed Membership
      await databaseService.query(`
        INSERT INTO organization_memberships (id, organization_id, user_id, role, created_at)
        VALUES ('mem_admin_apex', 'org_apex_global', 'usr_admin', 'OWNER', NOW())
        ON CONFLICT (organization_id, user_id) DO NOTHING;
      `);
      seededTables.push("organization_memberships");

      // 4. Seed Golden Project
      await databaseService.query(`
        INSERT INTO projects (id, organization_id, name, description, target_platform, current_state, active_branch, created_at, updated_at)
        VALUES ('proj_apex_os', 'org_apex_global', 'Apex Logistics OS', 'Next-Gen Autonomous Freight & Dispatch Management Platform', 'web', 'DESIGN_APPROVED', 'main', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
      `);
      seededTables.push("projects");

      console.log(`[Database Seed] Successfully seeded physical tables: ${seededTables.join(", ")}`);
      return { seeded: true, tables: seededTables };
    } catch (err: any) {
      console.warn("[Database Seed] Error during physical seeding:", err.message);
      return { seeded: false, tables: seededTables };
    }
  }

  // Fast-path in-memory mode is already seeded by DataStore constructor
  return {
    seeded: true,
    tables: ["organizations", "projects", "artifacts", "assets", "memberships (in-memory)"],
  };
}
