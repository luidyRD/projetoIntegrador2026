USE loginBD;

ALTER TABLE artistas
    ADD COLUMN spotify_url VARCHAR(255) NULL;
