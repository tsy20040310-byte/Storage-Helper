ALTER TABLE `users`
ADD COLUMN `deleted_at` DATETIME(3) NULL AFTER `safety_score`;

ALTER TABLE `order_reviews`
ADD COLUMN `deleted_at` DATETIME(3) NULL AFTER `tags_json`;

ALTER TABLE `portfolio_items`
ADD COLUMN `deleted_at` DATETIME(3) NULL AFTER `status`;

ALTER TABLE `case_studies`
ADD COLUMN `deleted_at` DATETIME(3) NULL AFTER `status`;

ALTER TABLE `emergency_contacts`
ADD COLUMN `deleted_at` DATETIME(3) NULL AFTER `relation`;

ALTER TABLE `disputes`
ADD COLUMN `deleted_at` DATETIME(3) NULL AFTER `resolution_note`;

ALTER TABLE `review_media`
ADD COLUMN `file_size` INTEGER NULL AFTER `url`;

ALTER TABLE `portfolio_media`
ADD COLUMN `file_size` INTEGER NULL AFTER `url`;

ALTER TABLE `case_study_media`
ADD COLUMN `file_size` INTEGER NULL AFTER `url`;

ALTER TABLE `dispute_evidences`
ADD COLUMN `file_size` INTEGER NULL AFTER `url`;

CREATE TABLE `audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `actor_user_id` VARCHAR(191) NULL,
    `actor_role` VARCHAR(20) NULL,
    `action` VARCHAR(80) NOT NULL,
    `resource_type` VARCHAR(80) NOT NULL,
    `resource_id` VARCHAR(191) NOT NULL,
    `details_json` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_actor_user_id_created_at_idx`(`actor_user_id`, `created_at`),
    INDEX `audit_logs_resource_type_resource_id_created_at_idx`(`resource_type`, `resource_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `audit_logs`
ADD CONSTRAINT `audit_logs_actor_user_id_fkey` FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
