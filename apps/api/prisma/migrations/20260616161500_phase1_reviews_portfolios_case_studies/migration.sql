CREATE TABLE `order_reviews` (
    `id` VARCHAR(191) NOT NULL,
    `order_id` VARCHAR(191) NOT NULL,
    `reviewer_user_id` VARCHAR(191) NOT NULL,
    `reviewee_user_id` VARCHAR(191) NOT NULL,
    `role` ENUM('client_to_organizer', 'organizer_to_client') NOT NULL,
    `overall_rating` INTEGER NOT NULL,
    `content` TEXT NULL,
    `tags_json` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `order_reviews_order_id_idx`(`order_id`),
    INDEX `order_reviews_reviewee_user_id_role_idx`(`reviewee_user_id`, `role`),
    UNIQUE INDEX `order_reviews_order_id_reviewer_user_id_role_key`(`order_id`, `reviewer_user_id`, `role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `portfolio_items` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(120) NOT NULL,
    `description` TEXT NOT NULL,
    `cover_image_url` TEXT NULL,
    `room_type` VARCHAR(60) NULL,
    `style_tags_text` TEXT NULL,
    `before_summary` TEXT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'published',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `portfolio_items_user_id_status_idx`(`user_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `case_studies` (
    `id` VARCHAR(191) NOT NULL,
    `portfolio_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(120) NOT NULL,
    `problem_summary` TEXT NOT NULL,
    `solution_summary` TEXT NOT NULL,
    `result_summary` TEXT NULL,
    `cover_image_url` TEXT NULL,
    `status` ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'published',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `case_studies_portfolio_id_status_idx`(`portfolio_id`, `status`),
    INDEX `case_studies_user_id_status_idx`(`user_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `order_reviews`
ADD CONSTRAINT `order_reviews_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT `order_reviews_reviewer_user_id_fkey` FOREIGN KEY (`reviewer_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
ADD CONSTRAINT `order_reviews_reviewee_user_id_fkey` FOREIGN KEY (`reviewee_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `portfolio_items`
ADD CONSTRAINT `portfolio_items_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `case_studies`
ADD CONSTRAINT `case_studies_portfolio_id_fkey` FOREIGN KEY (`portfolio_id`) REFERENCES `portfolio_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT `case_studies_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
