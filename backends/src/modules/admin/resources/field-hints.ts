/** Long-form fields rendered as textareas. */
export const TEXT_FIELDS = new Set([
  'bio', 'description', 'about', 'detail', 'howToRedeem', 'body', 'synopsis', 'notes', 'note',
  'whyJoin', 'contribution', 'reason', 'standfirst', 'purpose', 'adminReply', 'decisionNote',
  'reviewerNote', 'reviewNote', 'answer', 'spotlightAnswer', 'text', 'preview', 'caption', 'offer',
  'subtitle', 'template', 'metaDescription',
]);

/** URL fields that are not images. */
export const LINK_FIELDS = new Set([
  'linkedinUrl', 'spotifyUrl', 'appleUrl', 'buyUrl', 'inviteLink', 'fileUrl', 'pdfUrl',
  'audioUrl', 'documentUrl', 'link', 'href', 'ctaHref', 'mediaUrl', 'oldUrl', 'newUrl',
]);
