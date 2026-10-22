USE loginBD;

ALTER TABLE musicas
    ADD COLUMN audio_url VARCHAR(255) NULL;

CREATE TABLE artistas_independentes (
    artista_id INT NOT NULL PRIMARY KEY,
    usuario_id INT NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_artistas_independentes_usuario (usuario_id),
    CONSTRAINT fk_artistas_independentes_artista
        FOREIGN KEY (artista_id) REFERENCES artistas(id) ON DELETE CASCADE,
    CONSTRAINT fk_artistas_independentes_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
