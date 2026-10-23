import { ResourceConfig } from './types';

/** Admin sidebar group: Membership. Order here is the order in the sidebar. */
export const MEMBERSHIP_RESOURCES: ResourceConfig[] = [
  {
    name: 'members', model: 'Member', label: 'Members', singular: 'Member', group: 'Membership',
    labelField: 'fullName',
    idLabels: { json: { profileDraft: 'Member' } },
    // Written only by the member ("Save draft"); admins see it under Record details.
    readOnlyFields: ['profileDraft'],
    listColumns: ['avatarUrl', 'fullName', 'company', 'chapterId', 'tierId', 'isPublished', 'profileStatus', 'featuredNewMember'],
    searchFields: ['fullName', 'company', 'headline', 'email'],
    defaultSort: { field: 'fullName', order: 'asc' },
  },
  {
    name: 'applications', model: 'Application', label: 'Applications', singular: 'Application', group: 'Membership',
    labelField: 'fullName',
    listColumns: ['fullName', 'email', 'company', 'city', 'recommenderName', 'status', 'createdAt'],
    searchFields: ['fullName', 'email', 'company', 'city'],
    defaultSort: { field: 'createdAt', order: 'desc' },
    workflowStatuses: ['approved', 'rejected', 'waitlisted'],
  },
  {
    name: 'profile-revisions', model: 'ProfileRevision', label: 'Profile Reviews', singular: 'Profile Review', group: 'Membership',
    idLabels: { json: { changes: 'Member' } },
    // Members submit revisions; admins only approve / reject them (admin-workflows).
    noCreate: true,
    readOnlyFields: ['memberId', 'changes', 'reviewedAt', 'reviewerNote'],
    listColumns: ['memberId', 'status', 'createdAt', 'reviewedAt'],
    searchFields: [],
    defaultSort: { field: 'createdAt', order: 'desc' },
    workflowStatuses: ['approved', 'rejected'],
  },
  {
    name: 'member-interviews', model: 'MemberInterviewQA', label: 'New Member Interviews', singular: 'Interview Q&A', group: 'Membership',
    labelField: 'question',
    listColumns: ['memberId', 'question', 'sortOrder'],
    searchFields: ['question', 'answer'],
    defaultSort: { field: 'sortOrder', order: 'asc' },
  },
  {
    name: 'member-sectors', model: 'MemberSector', label: 'Member Sectors', singular: 'Member Sector', group: 'Membership',
    listColumns: ['memberId', 'sectorId', 'sortOrder'],
    searchFields: [],
    defaultSort: { field: 'sortOrder', order: 'asc' },
  },
  {
    name: 'member-answers', model: 'MemberQuestionAnswer', label: 'Five Questions Answers', singular: 'Answer', group: 'Membership',
    listColumns: ['memberId', 'questionId', 'answer'],
    searchFields: ['answer'],
  },
  {
    name: 'benefit-offers', model: 'BenefitOffer', label: 'Benefit Offers', singular: 'Benefit Offer', group: 'Membership',
    labelField: 'title',
    listColumns: ['imageUrl', 'title', 'kind', 'categoryId', 'providerName', 'featured', 'status'],
    searchFields: ['title', 'offer', 'providerName'],
    defaultSort: { field: 'sortOrder', order: 'asc' },
  },
  {
    name: 'benefit-opt-ins', model: 'BenefitOptIn', label: 'Benefit Opt-ins', singular: 'Opt-in', group: 'Membership',
    listColumns: ['memberId', 'offerId', 'createdAt'],
    searchFields: [],
    defaultSort: { field: 'createdAt', order: 'desc' },
  },
  {
    name: 'groups', model: 'Group', label: 'Groups', singular: 'Group', group: 'Membership',
    labelField: 'name',
    listColumns: ['name', 'note', 'cadence', 'status', 'proposedById'],
    searchFields: ['name', 'note', 'purpose'],
    defaultSort: { field: 'sortOrder', order: 'asc' },
  },
  {
    name: 'group-memberships', model: 'GroupMembership', label: 'Group Memberships', singular: 'Group Membership', group: 'Membership',
    listColumns: ['groupId', 'memberId', 'status', 'createdAt'],
    searchFields: [],
    defaultSort: { field: 'createdAt', order: 'desc' },
  },
];
