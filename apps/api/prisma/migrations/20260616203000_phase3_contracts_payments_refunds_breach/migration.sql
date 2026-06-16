ALTER TABLE `orders`
ADD COLUMN `candidate_pool_expires_at` DATETIME(3) NULL AFTER `longitude`,
ADD COLUMN `completion_confirmed_at` DATETIME(3) NULL AFTER `candidate_pool_expires_at`,
ADD COLUMN `cancelled_at` DATETIME(3) NULL AFTER `completion_confirmed_at`;

ALTER TABLE `orders`
MODIFY COLUMN `status` ENUM(
  'draft',
  'published',
  'applied',
  'candidate_pool_full',
  'awaiting_client_confirmation',
  'locked',
  'in_service',
  'awaiting_completion_confirmation',
  'completed',
  'cancelled',
  'disputed'
) NOT NULL DEFAULT 'published';

ALTER TABLE `organizer_profiles`
DROP COLUMN `specialties_text`,
DROP COLUMN `service_modes_text`,
DROP COLUMN `style_preference_text`;

ALTER TABLE `users`
ADD COLUMN `reputation_score` INTEGER NOT NULL DEFAULT 0 AFTER `trust_level`,
ADD COLUMN `reputation_level` VARCHAR(20) NOT NULL DEFAULT 'Lv1 新人整理师' AFTER `reputation_score`;

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

CREATE TABLE `service_contracts` (
    `id` VARCHAR(191) NOT NULL,
    `order_id` VARCHAR(191) NOT NULL,
    `client_id` VARCHAR(191) NOT NULL,
    `organizer_id` VARCHAR(191) NOT NULL,
    `service_date` DATETIME(3) NOT NULL,
    `service_address` VARCHAR(255) NOT NULL,
    `service_fee` DECIMAL(12, 2) NOT NULL,
    `travel_fee` DECIMAL(12, 2) NOT NULL,
    `platform_fee` DECIMAL(12, 2) NOT NULL,
    `cancellation_rule` TEXT NOT NULL,
    `breach_rule` TEXT NOT NULL,
    `contract_snapshot` TEXT NOT NULL,
    `signed_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `service_contracts_order_id_key`(`order_id`),
    INDEX `service_contracts_client_id_organizer_id_idx`(`client_id`, `organizer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `payments` (
    `id` VARCHAR(191) NOT NULL,
    `order_id` VARCHAR(191) NOT NULL,
    `payer_user_id` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `status` ENUM('pending', 'paid', 'escrowed', 'released', 'refunded') NOT NULL DEFAULT 'pending',
    `provider` VARCHAR(40) NOT NULL,
    `provider_transaction_id` VARCHAR(120) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `payments_order_id_status_idx`(`order_id`, `status`),
    INDEX `payments_payer_user_id_status_idx`(`payer_user_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `escrow_accounts` (
    `id` VARCHAR(191) NOT NULL,
    `order_id` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `status` ENUM('holding', 'released', 'refunded') NOT NULL DEFAULT 'holding',
    `release_eligible_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `released_at` DATETIME(3) NULL,

    UNIQUE INDEX `escrow_accounts_order_id_key`(`order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `transactions` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `order_id` VARCHAR(191) NULL,
    `type` ENUM('payment', 'escrow', 'release', 'refund', 'commission', 'deposit_deduction', 'deposit_refund', 'breach_compensation') NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `balance_before` DECIMAL(12, 2) NOT NULL,
    `balance_after` DECIMAL(12, 2) NOT NULL,
    `description` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `transactions_user_id_created_at_idx`(`user_id`, `created_at`),
    INDEX `transactions_order_id_created_at_idx`(`order_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `refunds` (
    `id` VARCHAR(191) NOT NULL,
    `order_id` VARCHAR(191) NOT NULL,
    `requester_id` VARCHAR(191) NOT NULL,
    `reason` TEXT NOT NULL,
    `refund_amount` DECIMAL(12, 2) NOT NULL,
    `status` ENUM('pending', 'approved', 'rejected', 'completed') NOT NULL DEFAULT 'pending',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `refunds_order_id_status_idx`(`order_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `breach_records` (
    `id` VARCHAR(191) NOT NULL,
    `order_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `breach_type` ENUM('client_cancel_late', 'client_no_show', 'organizer_no_show', 'organizer_late', 'organizer_cancel_late') NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `description` TEXT NOT NULL,
    `status` ENUM('pending', 'processed', 'waived') NOT NULL DEFAULT 'pending',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `breach_records_order_id_breach_type_idx`(`order_id`, `breach_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `organizer_deposits` (
    `id` VARCHAR(191) NOT NULL,
    `organizer_user_id` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `status` ENUM('active', 'depleted') NOT NULL DEFAULT 'active',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `organizer_deposits_organizer_user_id_key`(`organizer_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `organizer_profile_tags`
ADD CONSTRAINT `organizer_profile_tags_organizer_profile_id_fkey` FOREIGN KEY (`organizer_profile_id`) REFERENCES `organizer_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `portfolio_media`
ADD CONSTRAINT `portfolio_media_portfolio_item_id_fkey` FOREIGN KEY (`portfolio_item_id`) REFERENCES `portfolio_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `case_study_media`
ADD CONSTRAINT `case_study_media_case_study_id_fkey` FOREIGN KEY (`case_study_id`) REFERENCES `case_studies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `service_contracts`
ADD CONSTRAINT `service_contracts_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `payments`
ADD CONSTRAINT `payments_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT `payments_payer_user_id_fkey` FOREIGN KEY (`payer_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `escrow_accounts`
ADD CONSTRAINT `escrow_accounts_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `transactions`
ADD CONSTRAINT `transactions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT `transactions_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `refunds`
ADD CONSTRAINT `refunds_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT `refunds_requester_id_fkey` FOREIGN KEY (`requester_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `breach_records`
ADD CONSTRAINT `breach_records_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT `breach_records_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `organizer_deposits`
ADD CONSTRAINT `organizer_deposits_organizer_user_id_fkey` FOREIGN KEY (`organizer_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
