-- ========================================
-- MONETIZATION TABLES
-- ========================================

-- Subscription Plans table
CREATE TABLE `subscriptionPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`displayName` varchar(100) NOT NULL,
	`priceMonthly` int NOT NULL,
	`priceYearly` int NOT NULL,
	`creditsMonthly` int NOT NULL,
	`features` text,
	`isActive` int NOT NULL DEFAULT 1,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptionPlans_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptionPlans_name_unique` UNIQUE(`name`)
);

-- User Credits table
CREATE TABLE `userCredits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`balance` int NOT NULL DEFAULT 50,
	`totalPurchased` int NOT NULL DEFAULT 0,
	`totalEarned` int NOT NULL DEFAULT 0,
	`totalSpent` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userCredits_id` PRIMARY KEY(`id`),
	CONSTRAINT `userCredits_userId_unique` UNIQUE(`userId`)
);

-- Credit Transactions table
CREATE TABLE `creditTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` int NOT NULL,
	`type` enum('purchase','earn','spend','bonus','expire','refund') NOT NULL,
	`description` varchar(255) NOT NULL,
	`referenceType` varchar(50),
	`referenceId` int,
	`balanceAfter` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `creditTransactions_id` PRIMARY KEY(`id`),
	INDEX `idx_user_id`(`userId`),
	INDEX `idx_type`(`type`),
	INDEX `idx_created_at`(`createdAt`)
);

-- User Subscriptions table
CREATE TABLE `userSubscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`planId` int NOT NULL,
	`status` enum('active','cancelled','expired','past_due') NOT NULL DEFAULT 'active',
	`billingCycle` enum('monthly','yearly') NOT NULL DEFAULT 'monthly',
	`stripeSubscriptionId` varchar(255),
	`stripeCustomerId` varchar(255),
	`currentPeriodStart` timestamp NOT NULL,
	`currentPeriodEnd` timestamp NOT NULL,
	`cancelAtPeriodEnd` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userSubscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `userSubscriptions_userId_unique` UNIQUE(`userId`)
);

-- Credit Packs table
CREATE TABLE `creditPacks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`credits` int NOT NULL,
	`price` int NOT NULL,
	`bonusCredits` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `creditPacks_id` PRIMARY KEY(`id`)
);

-- Bonus Rules table
CREATE TABLE `bonusRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`type` enum('daily_login','first_generation','share','referral','streak_7','streak_30','review','profile_complete') NOT NULL,
	`credits` int NOT NULL,
	`maxClaims` int NOT NULL DEFAULT -1,
	`cooldownHours` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bonusRules_id` PRIMARY KEY(`id`)
);

-- User Bonuses table
CREATE TABLE `userBonuses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bonusRuleId` int NOT NULL,
	`creditsEarned` int NOT NULL,
	`claimedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userBonuses_id` PRIMARY KEY(`id`),
	INDEX `idx_user_id`(`userId`),
	INDEX `idx_bonus_rule_id`(`bonusRuleId`)
);

-- ========================================
-- SEED DATA
-- ========================================

-- Insert default subscription plans
INSERT INTO `subscriptionPlans` (`name`, `displayName`, `priceMonthly`, `priceYearly`, `creditsMonthly`, `features`, `sortOrder`) VALUES
('free', 'Free', 0, 0, 50, '["50 credits/day","Basic models","Watermark on exports","Standard generation speed"]', 0),
('starter', 'Starter', 900, 8640, 1000, '["1,000 credits/month","All models","No watermark","Priority generation","Email support"]', 1),
('pro', 'Pro', 2900, 27840, 5000, '["5,000 credits/month","All models","No watermark","Fastest generation","API access","Priority support"]', 2),
('ultra', 'Ultra', 7900, 75840, 20000, '["20,000 credits/month","All models","No watermark","Fastest generation","API access","4K generation","Commercial license","Dedicated support"]', 3);

-- Insert default credit packs
INSERT INTO `creditPacks` (`name`, `credits`, `price`, `bonusCredits`, `sortOrder`) VALUES
('100 Credits', 100, 499, 0, 0),
('500 Credits', 500, 1999, 50, 1),
('1000 Credits', 1000, 3499, 150, 2),
('5000 Credits', 5000, 14999, 1000, 3);

-- Insert default bonus rules
INSERT INTO `bonusRules` (`name`, `type`, `credits`, `maxClaims`, `cooldownHours`) VALUES
('Daily Login', 'daily_login', 5, -1, 24),
('First Generation', 'first_generation', 20, 1, 0),
('Share on Social', 'share', 10, 5, 1),
('Refer a Friend', 'referral', 50, -1, 0),
('7-Day Streak', 'streak_7', 100, -1, 168),
('30-Day Streak', 'streak_30', 500, -1, 720),
('Leave a Review', 'review', 25, 3, 24),
('Complete Profile', 'profile_complete', 30, 1, 0);
