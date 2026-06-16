ALTER TABLE `order_reviews`
ADD COLUMN `professional_score` INTEGER NULL AFTER `overall_rating`,
ADD COLUMN `communication_score` INTEGER NULL AFTER `professional_score`,
ADD COLUMN `punctuality_score` INTEGER NULL AFTER `communication_score`,
ADD COLUMN `result_score` INTEGER NULL AFTER `punctuality_score`;

CREATE TABLE `review_media` (
    `id` VARCHAR(191) NOT NULL,
    `review_id` VARCHAR(191) NOT NULL,
    `media_type` ENUM('image', 'video') NOT NULL,
    `url` TEXT NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `review_media_review_id_sort_order_idx`(`review_id`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `review_followups` (
    `id` VARCHAR(191) NOT NULL,
    `review_id` VARCHAR(191) NOT NULL,
    `author_user_id` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `review_followups_review_id_created_at_idx`(`review_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `case_studies`
ADD COLUMN `likes_count` INTEGER NOT NULL DEFAULT 0 AFTER `cover_image_url`,
ADD COLUMN `favorites_count` INTEGER NOT NULL DEFAULT 0 AFTER `likes_count`,
ADD COLUMN `views_count` INTEGER NOT NULL DEFAULT 0 AFTER `favorites_count`,
ADD COLUMN `is_featured` BOOLEAN NOT NULL DEFAULT false AFTER `views_count`;

CREATE TABLE `organizer_profiles` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `display_name` VARCHAR(80) NULL,
    `headline` VARCHAR(160) NULL,
    `specialties_text` TEXT NULL,
    `service_modes_text` TEXT NULL,
    `style_preference_text` TEXT NULL,
    `service_promise_text` TEXT NULL,
    `response_rate` INTEGER NOT NULL DEFAULT 0,
    `completed_orders_count` INTEGER NOT NULL DEFAULT 0,
    `featured_portfolio_id` VARCHAR(191) NULL,
    `featured_case_study_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `organizer_profiles_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `review_media`
ADD CONSTRAINT `review_media_review_id_fkey` FOREIGN KEY (`review_id`) REFERENCES `order_reviews`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `review_followups`
ADD CONSTRAINT `review_followups_review_id_fkey` FOREIGN KEY (`review_id`) REFERENCES `order_reviews`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT `review_followups_author_user_id_fkey` FOREIGN KEY (`author_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `organizer_profiles`
ADD CONSTRAINT `organizer_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
