USE loginBD;

CREATE TABLE IF NOT EXISTS artista_contas_pagamento (
    artista_id INT NOT NULL PRIMARY KEY,
    mp_user_id VARCHAR(40) NOT NULL,
    access_token_enc TEXT NOT NULL,
    refresh_token_enc TEXT NOT NULL,
    token_expira_em DATETIME NOT NULL,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_artista_contas_pagamento_artista
        FOREIGN KEY (artista_id) REFERENCES artistas_independentes(artista_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mercadopago_oauth_states (
    state CHAR(64) NOT NULL PRIMARY KEY,
    usuario_id INT NOT NULL,
    artista_id INT NOT NULL,
    expira_em DATETIME NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_mp_oauth_states_expira (expira_em),
    CONSTRAINT fk_mp_oauth_states_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_mp_oauth_states_artista
        FOREIGN KEY (artista_id) REFERENCES artistas_independentes(artista_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS apoios_artistas (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    referencia CHAR(36) NOT NULL,
    artista_id INT NOT NULL,
    apoiador_usuario_id INT NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'pending',
    status_detalhe VARCHAR(100) NULL,
    mp_preference_id VARCHAR(100) NULL,
    mp_payment_id VARCHAR(40) NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_apoios_artistas_referencia (referencia),
    UNIQUE KEY uq_apoios_artistas_mp_payment (mp_payment_id),
    INDEX idx_apoios_artistas_artista_status (artista_id, status),
    INDEX idx_apoios_artistas_apoiador (apoiador_usuario_id),
    CONSTRAINT chk_apoios_artistas_valor CHECK (valor >= 1.00 AND valor <= 1000.00),
    CONSTRAINT fk_apoios_artistas_artista
        FOREIGN KEY (artista_id) REFERENCES artistas_independentes(artista_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_apoios_artistas_apoiador
        FOREIGN KEY (apoiador_usuario_id) REFERENCES usuarios(id)
        ON DELETE CASCADE
);
