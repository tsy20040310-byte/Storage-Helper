ALTER TABLE `users`
ADD COLUMN `reputation_score` INTEGER NOT NULL DEFAULT 0 AFTER `trust_level`,
ADD COLUMN `reputation_level` VARCHAR(20) NOT NULL DEFAULT 'bronze' AFTER `reputation_score`;

CREATE TABLE `organizer_profile_tags` (
    `id` VARCHAR(191) NOT NULL,
    `organizer_profile_id` VARCHAR(191) NOT NULL,
    `tag_type` ENUM('style', 'service', 'badge') NOT NULL,
    `tag_value` VARCHAR(60) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `organizer_profile_tags_organizer_profile_id_tag_type_sort_order_idx`(`organizer_profile_id`, `tag_type`, `sort_order`),
    UNIQUE INDEX `organizer_profile_tags_organizer_profile_id_tag_type_tag_value_key`(`organizer_profile_id`, `tag_type`, `tag_value`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `portfolio_media` (
    `id` VARCHAR(191) NOT NULL,
    `portfolio_item_id` VARCHAR(191) NOT NULL,
    `stage` ENUM('before', 'after') NOT NULL,
    `url` TEXT NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `portfolio_media_portfolio_item_id_stage_sort_order_idx`(`portfolio_item_id`, `stage`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `case_study_media` (
    `id` VARCHAR(191) NOT NULL,
    `case_study_id` VARCHAR(191) NOT NULL,
    `stage` ENUM('before', 'after') NOT NULL,
    `url` TEXT NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `case_study_media_case_study_id_stage_sort_order_idx`(`case_study_id`, `stage`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `organizer_profile_tags`
ADD CONSTRAINT `organizer_profile_tags_organizer_profile_id_fkey` FOREIGN KEY (`organizer_profile_id`) REFERENCES `organizer_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `portfolio_media`
ADD CONSTRAINT `portfolio_media_portfolio_item_id_fkey` FOREIGN KEY (`portfolio_item_id`) REFERENCES `portfolio_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `case_study_media`
ADD CONSTRAINT `case_study_media_case_study_id_fkey` FOREIGN KEY (`case_study_id`) REFERENCES `case_studies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
