-- Migration 0001: Initial Platform Schema
-- Physical PostgreSQL DDL for AI UI/UX Designer & Design-to-Code Platform

CREATE TABLE IF NOT EXISTS organizations (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    auth_provider VARCHAR(64) NOT NULL DEFAULT 'local',
    auth_provider_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organization_memberships (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL DEFAULT 'VIEWER',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_org_user UNIQUE (organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    target_platform VARCHAR(32) NOT NULL DEFAULT 'web',
    current_state VARCHAR(64) NOT NULL DEFAULT 'INIT',
    active_branch VARCHAR(64) NOT NULL DEFAULT 'main',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS artifacts (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    artifact_type VARCHAR(64) NOT NULL,
    schema_version VARCHAR(32) NOT NULL DEFAULT '1.0.0',
    version INT NOT NULL DEFAULT 1,
    parent_artifact_id VARCHAR(64),
    status VARCHAR(32) NOT NULL DEFAULT 'draft',
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS artifact_edges (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    from_id VARCHAR(64) NOT NULL,
    to_id VARCHAR(64) NOT NULL,
    edge_type VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assets (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(128) NOT NULL,
    size_bytes BIGINT NOT NULL,
    storage_path TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS builds (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL,
    exit_code INT NOT NULL DEFAULT 0,
    logs_text TEXT NOT NULL DEFAULT '',
    bundle_size_kb INT NOT NULL DEFAULT 0,
    duration_ms INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS previews (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    build_id VARCHAR(64) NOT NULL,
    preview_url TEXT NOT NULL,
    screenshot_url TEXT NOT NULL DEFAULT '',
    viewport_mode VARCHAR(32) NOT NULL DEFAULT 'desktop',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comments (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    artifact_id VARCHAR(64),
    author VARCHAR(255) NOT NULL,
    target_type VARCHAR(64) NOT NULL,
    target_ref VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL,
    project_id VARCHAR(64),
    user_id VARCHAR(64) NOT NULL,
    action VARCHAR(128) NOT NULL,
    resource_type VARCHAR(64) NOT NULL,
    resource_id VARCHAR(64) NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_proj_type ON artifacts(project_id, artifact_type);
CREATE INDEX IF NOT EXISTS idx_artifacts_proj_ver ON artifacts(project_id, version);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_proj ON audit_logs(organization_id, project_id);
CREATE INDEX IF NOT EXISTS idx_comments_project ON comments(project_id);
CREATE INDEX IF NOT EXISTS idx_builds_project ON builds(project_id);
