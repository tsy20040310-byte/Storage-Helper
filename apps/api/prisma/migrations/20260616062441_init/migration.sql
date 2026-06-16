-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `role` ENUM('client', 'organizer', 'admin') NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `email` VARCHAR(120) NULL,
    `status` ENUM('active', 'disabled', 'banned') NOT NULL DEFAULT 'active',
    `trust_score` INTEGER NOT NULL DEFAULT 100,
    `trust_level` VARCHAR(4) NOT NULL DEFAULT 'A+',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_phone_key`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_profiles` (
    `user_id` VARCHAR(191) NOT NULL,
    `nickname` VARCHAR(60) NULL,
    `avatar_url` TEXT NULL,
    `real_name` VARCHAR(50) NULL,
    `gender` ENUM('male', 'female', 'other') NULL,
    `city_code` VARCHAR(20) NULL,
    `bio` TEXT NULL,

    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `identity_verifications` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `full_name` VARCHAR(50) NOT NULL,
    `id_number` VARCHAR(32) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `gender` ENUM('male', 'female', 'other') NOT NULL,
    `review_status` ENUM('unverified', 'pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `review_note` TEXT NULL,
    `submitted_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewed_at` DATETIME(3) NULL,

    INDEX `identity_verifications_user_id_review_status_idx`(`user_id`, `review_status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_profiles` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `service_city_code` VARCHAR(20) NOT NULL,
    `years_experience` INTEGER NOT NULL DEFAULT 0,
    `intro` TEXT NULL,
    `approval_status` ENUM('unverified', 'pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `service_profiles_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` VARCHAR(191) NOT NULL,
    `client_user_id` VARCHAR(191) NOT NULL,
    `organizer_user_id` VARCHAR(191) NULL,
    `title` VARCHAR(120) NOT NULL,
    `description` TEXT NOT NULL,
    `city_code` VARCHAR(20) NOT NULL,
    `district` VARCHAR(50) NULL,
    `address_line` VARCHAR(255) NOT NULL,
    `floor` VARCHAR(20) NULL,
    `has_elevator` BOOLEAN NOT NULL DEFAULT false,
    `scheduled_start_at` DATETIME(3) NOT NULL,
    `estimated_duration_minutes` INTEGER NOT NULL,
    `storage_supply_status` ENUM('owned', 'need_organizer_prepare', 'unknown') NOT NULL,
    `special_notes` TEXT NULL,
    `same_gender_only` BOOLEAN NOT NULL DEFAULT false,
    `start_pin_code` VARCHAR(6) NOT NULL,
    `arrival_radius_meters` INTEGER NOT NULL DEFAULT 50,
    `latitude` DECIMAL(10, 7) NOT NULL,
    `longitude` DECIMAL(10, 7) NOT NULL,
    `status` ENUM('draft', 'published', 'applied', 'awaiting_client_confirmation', 'locked', 'in_service', 'awaiting_completion_confirmation', 'completed', 'cancelled', 'disputed') NOT NULL DEFAULT 'published',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `orders_client_user_id_status_idx`(`client_user_id`, `status`),
    INDEX `orders_organizer_user_id_status_idx`(`organizer_user_id`, `status`),
    INDEX `orders_scheduled_start_at_idx`(`scheduled_start_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_media` (
    `id` VARCHAR(191) NOT NULL,
    `order_id` VARCHAR(191) NOT NULL,
    `media_type` ENUM('image', 'video') NOT NULL,
    `url` TEXT NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_applications` (
    `id` VARCHAR(191) NOT NULL,
    `order_id` VARCHAR(191) NOT NULL,
    `organizer_user_id` VARCHAR(191) NOT NULL,
    `message` TEXT NULL,
    `quoted_price` DECIMAL(12, 2) NULL,
    `status` ENUM('pending', 'accepted', 'rejected', 'withdrawn') NOT NULL DEFAULT 'pending',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `order_applications_order_id_status_idx`(`order_id`, `status`),
    UNIQUE INDEX `order_applications_order_id_organizer_user_id_key`(`order_id`, `organizer_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `order_id` VARCHAR(191) NOT NULL,
    `started_at` DATETIME(3) NULL,
    `ended_at` DATETIME(3) NULL,
    `start_verification_status` ENUM('pending', 'gps_verified', 'pin_verified', 'started', 'failed') NOT NULL DEFAULT 'pending',
    `actual_duration_minutes` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `service_sessions_order_id_key`(`order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_profiles` ADD CONSTRAINT `user_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `identity_verifications` ADD CONSTRAINT `identity_verifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_profiles` ADD CONSTRAINT `service_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_client_user_id_fkey` FOREIGN KEY (`client_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_organizer_user_id_fkey` FOREIGN KEY (`organizer_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_media` ADD CONSTRAINT `order_media_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_applications` ADD CONSTRAINT `order_applications_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_applications` ADD CONSTRAINT `order_applications_organizer_user_id_fkey` FOREIGN KEY (`organizer_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_sessions` ADD CONSTRAINT `service_sessions_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
