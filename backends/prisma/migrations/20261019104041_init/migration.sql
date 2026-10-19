-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'member');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('invited', 'active', 'suspended');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('draft', 'in_review', 'scheduled', 'published', 'archived', 'rejected');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('public', 'members');

-- CreateEnum
CREATE TYPE "ProfileStatus" AS ENUM ('draft', 'pending_review', 'published');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('new', 'in_review', 'approved', 'rejected', 'waitlisted');

-- CreateEnum
CREATE TYPE "BenefitKind" AS ENUM ('member', 'partner');

-- CreateEnum
CREATE TYPE "MembershipRequestStatus" AS ENUM ('requested', 'approved', 'rejected', 'left');

-- CreateEnum
CREATE TYPE "EventKind" AS ENUM ('Salon', 'Dinner', 'Reception', 'Roundtable');

-- CreateEnum
CREATE TYPE "RsvpStatus" AS ENUM ('interested', 'confirmed', 'waitlisted', 'declined', 'cancelled');

-- CreateEnum
CREATE TYPE "VenueCategory" AS ENUM ('Restaurants', 'Clubs', 'Studios', 'Salons', 'Hotels', 'Private_homes');

-- CreateEnum
CREATE TYPE "PhotoKind" AS ENUM ('Curated', 'Candid');

-- CreateEnum
CREATE TYPE "Publication" AS ENUM ('inforum', 'forecast', 'member');

-- CreateEnum
CREATE TYPE "PitchFormat" AS ENUM ('article', 'dispatch', 'interview', 'photo_essay', 'opinion', 'forecast');

-- CreateEnum
CREATE TYPE "RecommendationCategory" AS ENUM ('eat', 'stay', 'travel', 'read');

-- CreateEnum
CREATE TYPE "CommentTarget" AS ENUM ('edition', 'article', 'feed_post');

-- CreateEnum
CREATE TYPE "LibraryKind" AS ENUM ('Annual_Report', 'Journal');

-- CreateEnum
CREATE TYPE "IntroductionStatus" AS ENUM ('requested', 'pending', 'accepted', 'declined');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('review', 'approve', 'sign', 'pay', 'fill');

-- CreateEnum
CREATE TYPE "ActionContext" AS ENUM ('Membership', 'Events', 'Media', 'Communications', 'Benefits');

-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('pending', 'completed', 'dismissed', 'overdue');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('draft', 'scheduled', 'sent');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('new_member', 'rsvp_reminder', 'publication', 'profile_view', 'approval', 'general');

-- CreateEnum
CREATE TYPE "ConciergeStatus" AS ENUM ('open', 'answered', 'closed');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'member',
    "status" "UserStatus" NOT NULL DEFAULT 'invited',
    "lastLoginAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "isChapter" BOOLEAN NOT NULL DEFAULT false,
    "whatsappEnabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sector" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Sector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipTier" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceCents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "MembershipTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileQuestion" (
    "id" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ProfileQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "slug" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "headline" TEXT,
    "company" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "linkedinUrl" TEXT,
    "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "travelCities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "joinedYear" INTEGER,
    "chapterId" UUID,
    "sectorId" UUID,
    "tierId" UUID,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "profileStatus" "ProfileStatus" NOT NULL DEFAULT 'published',
    "featuredNewMember" BOOLEAN NOT NULL DEFAULT false,
    "spotlightQuestion" TEXT,
    "spotlightAnswer" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberQuestionAnswer" (
    "id" UUID NOT NULL,
    "memberId" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "MemberQuestionAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberInterviewQA" (
    "id" UUID NOT NULL,
    "memberId" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "MemberInterviewQA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileRevision" (
    "id" UUID NOT NULL,
    "memberId" UUID NOT NULL,
    "changes" JSONB NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'pending',
    "reviewerNote" TEXT,
    "reviewedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ProfileRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "linkedin" TEXT,
    "role" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "travelCities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "recommenderName" TEXT NOT NULL,
    "recommenderMemberId" UUID,
    "recommenderRelation" TEXT,
    "whyJoin" TEXT NOT NULL,
    "contribution" TEXT NOT NULL,
    "about" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'new',
    "decisionNote" TEXT,
    "decidedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BenefitCategory" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "BenefitKind" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "BenefitCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BenefitOffer" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" "BenefitKind" NOT NULL,
    "title" TEXT NOT NULL,
    "offer" TEXT NOT NULL,
    "categoryId" UUID,
    "providerMemberId" UUID,
    "providerName" TEXT NOT NULL,
    "providerRole" TEXT,
    "location" TEXT,
    "about" TEXT,
    "detail" TEXT,
    "howToRedeem" TEXT,
    "imageUrl" TEXT,
    "companyImageUrl" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'published',
    "publishAt" TIMESTAMPTZ,
    "unpublishAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "BenefitOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BenefitOptIn" (
    "id" UUID NOT NULL,
    "memberId" UUID NOT NULL,
    "offerId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BenefitOptIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "note" TEXT,
    "purpose" TEXT,
    "cadence" TEXT,
    "coverUrl" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'published',
    "proposedById" UUID,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMembership" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "memberId" UUID NOT NULL,
    "status" "MembershipRequestStatus" NOT NULL DEFAULT 'requested',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "GroupMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venue" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "chapterId" UUID,
    "city" TEXT NOT NULL,
    "category" "VenueCategory" NOT NULL,
    "access" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "privateAddress" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'published',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" "EventKind" NOT NULL,
    "city" TEXT NOT NULL,
    "chapterId" UUID,
    "venueId" UUID,
    "venueText" TEXT,
    "startsAt" TIMESTAMPTZ NOT NULL,
    "endsAt" TIMESTAMPTZ,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "dateLabel" TEXT,
    "timeLabel" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "privateAddress" TEXT,
    "addressRevealHours" INTEGER NOT NULL DEFAULT 48,
    "capacity" INTEGER,
    "inviteAudiences" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "supportRequested" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "status" "ContentStatus" NOT NULL DEFAULT 'published',
    "visibility" "Visibility" NOT NULL DEFAULT 'members',
    "proposedById" UUID,
    "reviewNote" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventHost" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "memberId" UUID NOT NULL,

    CONSTRAINT "EventHost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventRsvp" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "memberId" UUID NOT NULL,
    "status" "RsvpStatus" NOT NULL DEFAULT 'confirmed',
    "plusOnes" INTEGER NOT NULL DEFAULT 0,
    "dietaryNote" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "EventRsvp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryAlbum" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "eventId" UUID,
    "chapterId" UUID,
    "city" TEXT NOT NULL,
    "dateLabel" TEXT NOT NULL,
    "takenOn" TIMESTAMPTZ,
    "coverUrl" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'published',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "GalleryAlbum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryPhoto" (
    "id" UUID NOT NULL,
    "albumId" UUID NOT NULL,
    "caption" TEXT,
    "url" TEXT NOT NULL,
    "kind" "PhotoKind" NOT NULL DEFAULT 'Curated',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "GalleryPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberPhotoTag" (
    "id" UUID NOT NULL,
    "memberId" UUID NOT NULL,
    "photoId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberPhotoTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InforumSection" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "InforumSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InforumEdition" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "publishedOn" TIMESTAMPTZ NOT NULL,
    "coverLine" TEXT,
    "coverUrl" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'published',
    "visibility" "Visibility" NOT NULL DEFAULT 'members',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "InforumEdition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EditionArticle" (
    "id" UUID NOT NULL,
    "editionId" UUID NOT NULL,
    "articleId" UUID NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EditionArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForecastIssue" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "issue" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dateLabel" TEXT NOT NULL,
    "publishedOn" TIMESTAMPTZ,
    "coverUrl" TEXT,
    "letterTitle" TEXT,
    "letterBody" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "letterSignoff" TEXT,
    "pdfUrl" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'published',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ForecastIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "publication" "Publication" NOT NULL,
    "title" TEXT NOT NULL,
    "standfirst" TEXT,
    "body" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sectionId" UUID,
    "sectionLabel" TEXT,
    "forecastIssueId" UUID,
    "authorMemberId" UUID,
    "authorName" TEXT NOT NULL,
    "authorRole" TEXT,
    "authorPhotoUrl" TEXT,
    "isMember" BOOLEAN NOT NULL DEFAULT false,
    "editorsChoice" BOOLEAN NOT NULL DEFAULT false,
    "fromAroundWorld" BOOLEAN NOT NULL DEFAULT false,
    "dateline" TEXT,
    "dateLabel" TEXT,
    "readMinutes" INTEGER,
    "imageUrl" TEXT,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'published',
    "visibility" "Visibility" NOT NULL DEFAULT 'members',
    "publishedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pitch" (
    "id" UUID NOT NULL,
    "memberId" UUID,
    "headline" TEXT NOT NULL,
    "synopsis" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "format" "PitchFormat" NOT NULL DEFAULT 'article',
    "dateline" TEXT,
    "notes" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'pending',
    "articleId" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Pitch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" UUID NOT NULL,
    "category" "RecommendationCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "place" TEXT,
    "note" TEXT,
    "memberId" UUID,
    "memberName" TEXT NOT NULL,
    "memberPhotoUrl" TEXT,
    "memberChapter" TEXT,
    "imageUrl" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'published',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" UUID NOT NULL,
    "targetType" "CommentTarget" NOT NULL DEFAULT 'edition',
    "targetId" TEXT,
    "parentId" UUID,
    "memberId" UUID,
    "memberName" TEXT NOT NULL,
    "memberPhotoUrl" TEXT,
    "memberChapter" TEXT,
    "body" TEXT NOT NULL,
    "recommends" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'published',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentRecommend" (
    "id" UUID NOT NULL,
    "commentId" UUID NOT NULL,
    "memberId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentRecommend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PodcastEpisode" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "guestName" TEXT NOT NULL,
    "guestMemberId" UUID,
    "durationMinutes" INTEGER,
    "audioUrl" TEXT,
    "spotifyUrl" TEXT,
    "appleUrl" TEXT,
    "coverUrl" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'published',
    "publishedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "PodcastEpisode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Book" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorMemberId" UUID,
    "isMemberBook" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "coverUrl" TEXT,
    "buyUrl" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'published',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookRecommendation" (
    "id" UUID NOT NULL,
    "bookId" UUID,
    "title" TEXT NOT NULL,
    "note" TEXT,
    "recommendedByName" TEXT NOT NULL,
    "recommendedById" UUID,
    "chapter" TEXT,
    "isCuratedPick" BOOLEAN NOT NULL DEFAULT false,
    "status" "ContentStatus" NOT NULL DEFAULT 'published',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "BookRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryItem" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" "LibraryKind" NOT NULL,
    "pages" INTEGER,
    "description" TEXT,
    "coverUrl" TEXT,
    "fileUrl" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'published',
    "publishedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "LibraryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedPost" (
    "id" UUID NOT NULL,
    "memberId" UUID,
    "authorName" TEXT NOT NULL,
    "authorMeta" TEXT,
    "authorPhotoUrl" TEXT,
    "body" TEXT NOT NULL,
    "imageUrl" TEXT,
    "imageAlt" TEXT,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "status" "ContentStatus" NOT NULL DEFAULT 'published',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "FeedPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedLike" (
    "id" UUID NOT NULL,
    "postId" UUID NOT NULL,
    "memberId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Introduction" (
    "id" UUID NOT NULL,
    "requesterId" UUID,
    "targetId" UUID NOT NULL,
    "introducerId" UUID,
    "introducerName" TEXT,
    "reason" TEXT,
    "status" "IntroductionStatus" NOT NULL DEFAULT 'pending',
    "respondedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Introduction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappGroup" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "chapterId" UUID,
    "inviteLink" TEXT,
    "moderatorId" UUID,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "WhatsappGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappMembership" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "memberId" UUID NOT NULL,
    "status" "MembershipRequestStatus" NOT NULL DEFAULT 'requested',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "WhatsappMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailCampaign" (
    "id" UUID NOT NULL,
    "subject" TEXT NOT NULL,
    "senderLabel" TEXT NOT NULL DEFAULT 'Forum Team',
    "preview" TEXT,
    "body" TEXT,
    "audience" JSONB,
    "status" "CampaignStatus" NOT NULL DEFAULT 'draft',
    "scheduledAt" TIMESTAMPTZ,
    "sentAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "EmailCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailDelivery" (
    "id" UUID NOT NULL,
    "campaignId" UUID NOT NULL,
    "memberId" UUID NOT NULL,
    "openedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "memberId" UUID,
    "type" "NotificationType" NOT NULL DEFAULT 'general',
    "title" TEXT NOT NULL,
    "body" TEXT,
    "link" TEXT,
    "readAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionItem" (
    "id" UUID NOT NULL,
    "memberId" UUID,
    "type" "ActionType" NOT NULL,
    "context" "ActionContext" NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT,
    "dueAt" TIMESTAMPTZ,
    "amountCents" INTEGER,
    "currency" TEXT,
    "documentUrl" TEXT,
    "status" "ActionStatus" NOT NULL DEFAULT 'pending',
    "completedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ActionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConciergeRequest" (
    "id" UUID NOT NULL,
    "memberId" UUID,
    "promptType" TEXT,
    "body" TEXT NOT NULL,
    "status" "ConciergeStatus" NOT NULL DEFAULT 'open',
    "adminReply" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ConciergeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Page" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "blocks" JSONB,
    "status" "ContentStatus" NOT NULL DEFAULT 'published',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "actorId" UUID,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "diff" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_name_key" ON "Chapter"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Sector_name_key" ON "Sector"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipTier_name_key" ON "MembershipTier"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Member_userId_key" ON "Member"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Member_slug_key" ON "Member"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "MemberQuestionAnswer_memberId_questionId_key" ON "MemberQuestionAnswer"("memberId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "BenefitCategory_name_key" ON "BenefitCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BenefitOffer_slug_key" ON "BenefitOffer"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BenefitOptIn_memberId_offerId_key" ON "BenefitOptIn"("memberId", "offerId");

-- CreateIndex
CREATE UNIQUE INDEX "Group_slug_key" ON "Group"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMembership_groupId_memberId_key" ON "GroupMembership"("groupId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "Venue_slug_key" ON "Venue"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "EventHost_eventId_memberId_key" ON "EventHost"("eventId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "EventRsvp_eventId_memberId_key" ON "EventRsvp"("eventId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "GalleryAlbum_slug_key" ON "GalleryAlbum"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "MemberPhotoTag_memberId_photoId_key" ON "MemberPhotoTag"("memberId", "photoId");

-- CreateIndex
CREATE UNIQUE INDEX "InforumSection_key_key" ON "InforumSection"("key");

-- CreateIndex
CREATE UNIQUE INDEX "InforumEdition_slug_key" ON "InforumEdition"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "EditionArticle_editionId_articleId_key" ON "EditionArticle"("editionId", "articleId");

-- CreateIndex
CREATE UNIQUE INDEX "ForecastIssue_slug_key" ON "ForecastIssue"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CommentRecommend_commentId_memberId_key" ON "CommentRecommend"("commentId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "PodcastEpisode_slug_key" ON "PodcastEpisode"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryItem_slug_key" ON "LibraryItem"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "FeedLike_postId_memberId_key" ON "FeedLike"("postId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappGroup_name_key" ON "WhatsappGroup"("name");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappMembership_groupId_memberId_key" ON "WhatsappMembership"("groupId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailDelivery_campaignId_memberId_key" ON "EmailDelivery"("campaignId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "Page_slug_key" ON "Page"("slug");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "MembershipTier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberQuestionAnswer" ADD CONSTRAINT "MemberQuestionAnswer_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberQuestionAnswer" ADD CONSTRAINT "MemberQuestionAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "ProfileQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberInterviewQA" ADD CONSTRAINT "MemberInterviewQA_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileRevision" ADD CONSTRAINT "ProfileRevision_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_recommenderMemberId_fkey" FOREIGN KEY ("recommenderMemberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BenefitOffer" ADD CONSTRAINT "BenefitOffer_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BenefitCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BenefitOffer" ADD CONSTRAINT "BenefitOffer_providerMemberId_fkey" FOREIGN KEY ("providerMemberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BenefitOptIn" ADD CONSTRAINT "BenefitOptIn_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BenefitOptIn" ADD CONSTRAINT "BenefitOptIn_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "BenefitOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_proposedById_fkey" FOREIGN KEY ("proposedById") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMembership" ADD CONSTRAINT "GroupMembership_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMembership" ADD CONSTRAINT "GroupMembership_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venue" ADD CONSTRAINT "Venue_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_proposedById_fkey" FOREIGN KEY ("proposedById") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventHost" ADD CONSTRAINT "EventHost_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventHost" ADD CONSTRAINT "EventHost_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRsvp" ADD CONSTRAINT "EventRsvp_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRsvp" ADD CONSTRAINT "EventRsvp_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryAlbum" ADD CONSTRAINT "GalleryAlbum_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryAlbum" ADD CONSTRAINT "GalleryAlbum_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryPhoto" ADD CONSTRAINT "GalleryPhoto_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "GalleryAlbum"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberPhotoTag" ADD CONSTRAINT "MemberPhotoTag_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberPhotoTag" ADD CONSTRAINT "MemberPhotoTag_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "GalleryPhoto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditionArticle" ADD CONSTRAINT "EditionArticle_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "InforumEdition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditionArticle" ADD CONSTRAINT "EditionArticle_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "InforumSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_forecastIssueId_fkey" FOREIGN KEY ("forecastIssueId") REFERENCES "ForecastIssue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_authorMemberId_fkey" FOREIGN KEY ("authorMemberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pitch" ADD CONSTRAINT "Pitch_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pitch" ADD CONSTRAINT "Pitch_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentRecommend" ADD CONSTRAINT "CommentRecommend_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentRecommend" ADD CONSTRAINT "CommentRecommend_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PodcastEpisode" ADD CONSTRAINT "PodcastEpisode_guestMemberId_fkey" FOREIGN KEY ("guestMemberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_authorMemberId_fkey" FOREIGN KEY ("authorMemberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookRecommendation" ADD CONSTRAINT "BookRecommendation_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookRecommendation" ADD CONSTRAINT "BookRecommendation_recommendedById_fkey" FOREIGN KEY ("recommendedById") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedPost" ADD CONSTRAINT "FeedPost_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedLike" ADD CONSTRAINT "FeedLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "FeedPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedLike" ADD CONSTRAINT "FeedLike_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Introduction" ADD CONSTRAINT "Introduction_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Introduction" ADD CONSTRAINT "Introduction_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Introduction" ADD CONSTRAINT "Introduction_introducerId_fkey" FOREIGN KEY ("introducerId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappGroup" ADD CONSTRAINT "WhatsappGroup_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappGroup" ADD CONSTRAINT "WhatsappGroup_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappMembership" ADD CONSTRAINT "WhatsappMembership_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "WhatsappGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappMembership" ADD CONSTRAINT "WhatsappMembership_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailDelivery" ADD CONSTRAINT "EmailDelivery_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "EmailCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailDelivery" ADD CONSTRAINT "EmailDelivery_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionItem" ADD CONSTRAINT "ActionItem_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConciergeRequest" ADD CONSTRAINT "ConciergeRequest_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
