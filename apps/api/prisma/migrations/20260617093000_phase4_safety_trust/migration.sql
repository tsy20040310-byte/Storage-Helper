ALTER TABLE `users`
ADD COLUMN `safety_score` INTEGER NOT NULL DEFAULT 100 AFTER `reputation_level`;

ALTER TABLE `orders`
ADD COLUMN `gender_preference` ENUM('female_only', 'no_preference') NOT NULL DEFAULT 'no_preference' AFTER `same_gender_only`,
ADD COLUMN `share_token` VARCHAR(64) NULL AFTER `longitude`;

CREATE UNIQUE INDEX `orders_share_token_key` ON `orders`(`share_token`);

CREATE TABLE `emergency_contacts` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(60) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `relation` VARCHAR(60) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `emergency_contacts_user_id_created_at_idx`(`user_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `sos_events` (
    `id` VARCHAR(191) NOT NULL,
    `order_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `organizer_id` VARCHAR(191) NULL,
    `latitude` DECIMAL(10, 7) NOT NULL,
    `longitude` DECIMAL(10, 7) NOT NULL,
    `status` ENUM('new', 'processing', 'resolved') NOT NULL DEFAULT 'new',
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `sos_events_order_id_status_idx`(`order_id`, `status`),
    INDEX `sos_events_user_id_created_at_idx`(`user_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `disputes` (
    `id` VARCHAR(191) NOT NULL,
    `order_id` VARCHAR(191) NOT NULL,
    `initiator_user_id` VARCHAR(191) NOT NULL,
    `respondent_user_id` VARCHAR(191) NULL,
    `subject` VARCHAR(120) NOT NULL,
    `description` TEXT NOT NULL,
    `status` ENUM('open', 'in_review', 'resolved', 'rejected') NOT NULL DEFAULT 'open',
    `resolution_type` ENUM('complaint_upheld', 'harassment', 'severe_violation', 'no_fault', 'settlement') NULL,
    `resolution_note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `resolved_at` DATETIME(3) NULL,

    INDEX `disputes_order_id_status_idx`(`order_id`, `status`),
    INDEX `disputes_initiator_user_id_created_at_idx`(`initiator_user_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `dispute_messages` (
    `id` VARCHAR(191) NOT NULL,
    `dispute_id` VARCHAR(191) NOT NULL,
    `sender_user_id` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `dispute_messages_dispute_id_created_at_idx`(`dispute_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `dispute_evidences` (
    `id` VARCHAR(191) NOT NULL,
    `dispute_id` VARCHAR(191) NOT NULL,
    `uploader_user_id` VARCHAR(191) NOT NULL,
    `evidence_type` ENUM('image', 'video', 'file') NOT NULL,
    `url` TEXT NOT NULL,
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `dispute_evidences_dispute_id_created_at_idx`(`dispute_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `emergency_contacts`
ADD CONSTRAINT `emergency_contacts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `sos_events`
ADD CONSTRAINT `sos_events_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT `sos_events_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT `sos_events_organizer_id_fkey` FOREIGN KEY (`organizer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `disputes`
ADD CONSTRAINT `disputes_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT `disputes_initiator_user_id_fkey` FOREIGN KEY (`initiator_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT `disputes_respondent_user_id_fkey` FOREIGN KEY (`respondent_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `dispute_messages`
ADD CONSTRAINT `dispute_messages_dispute_id_fkey` FOREIGN KEY (`dispute_id`) REFERENCES `disputes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT `dispute_messages_sender_user_id_fkey` FOREIGN KEY (`sender_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `dispute_evidences`
ADD CONSTRAINT `dispute_evidences_dispute_id_fkey` FOREIGN KEY (`dispute_id`) REFERENCES `disputes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT `dispute_evidences_uploader_user_id_fkey` FOREIGN KEY (`uploader_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
