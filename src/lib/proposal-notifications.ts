import { notificationService } from './notification/notification-service';

/**
 * Comprehensive notification service for proposal-related activities
 */
export const proposalNotifications = {
  /**
   * Send notification when user submits a proposal
   */
  notifyProposalSubmitted: async (userId: string, proposalTitle: string, proposalId: number) => {
    try {
      await notificationService.createNotification({
        user_id: userId,
        type: 'proposal_submitted',
        title: 'Proposal Submitted',
        message: `Your event proposal "${proposalTitle}" has been submitted successfully. We'll review it and get back to you soon!`,
        resource_id: proposalId,
        resource_type: 'proposal',
        link: `/request-event`,
        data: {
          proposal_id: proposalId,
          proposal_title: proposalTitle,
        }
      });
    } catch (error) {
      console.error('Error sending proposal submission notification:', error);
    }
  },

  /**
   * Send notification when proposal is approved
   */
  notifyProposalApproved: async (userId: string, proposalTitle: string, proposalId: number, eventId?: number) => {
    try {
      await notificationService.createNotification({
        user_id: userId,
        type: 'proposal_approved',
        title: '🎉 Proposal Approved!',
        message: `Great news! Your event proposal "${proposalTitle}" has been approved${eventId ? ' and published as an event' : ''}.`,
        resource_id: proposalId,
        resource_type: 'proposal',
        link: eventId ? `/events/${eventId}` : `/admin/proposals`,
        data: {
          proposal_id: proposalId,
          proposal_title: proposalTitle,
          event_id: eventId,
        }
      });
      
      // Also notify admins
      await proposalNotifications.notifyAdminsProposalApproved(userId, proposalTitle, proposalId);
    } catch (error) {
      console.error('Error sending proposal approval notification:', error);
    }
  },

  /**
   * Send notification when proposal is rejected
   */
  notifyProposalRejected: async (userId: string, proposalTitle: string, proposalId: number, reason?: string) => {
    try {
      await notificationService.createNotification({
        user_id: userId,
        type: 'proposal_rejected',
        title: 'Proposal Update',
        message: `Your event proposal "${proposalTitle}" was not approved at this time.${reason ? ` Reason: ${reason}` : ' Feel free to submit another proposal!'}`,
        resource_id: proposalId,
        resource_type: 'proposal',
        link: `/request-event`,
        data: {
          proposal_id: proposalId,
          proposal_title: proposalTitle,
          rejection_reason: reason,
        }
      });
    } catch (error) {
      console.error('Error sending proposal rejection notification:', error);
    }
  },

  /**
   * Notify admins when a new proposal lands for review.
   */
  notifyAdminsProposalSubmitted: async (proposalTitle: string, proposalId: number) => {
    try {
      await notificationService.notifyAdmins({
        type: 'proposal_submitted',
        title: 'New event proposal',
        message: `"${proposalTitle}" is awaiting review.`,
        resource_id: proposalId,
        resource_type: 'proposal',
        link: '/admin/proposals',
        data: { proposal_id: proposalId, proposal_title: proposalTitle },
      });
    } catch (error) {
      console.error('Error notifying admins of proposal submission:', error);
    }
  },

  /**
   * Notify admins when a proposal is approved
   */
  notifyAdminsProposalApproved: async (
    _userId: string,
    proposalTitle: string,
    proposalId: number
  ) => {
    try {
      await notificationService.notifyAdmins({
        type: 'admin_action',
        title: 'Proposal approved',
        message: `Proposal "${proposalTitle}" was approved and published.`,
        resource_id: proposalId,
        resource_type: 'proposal',
        link: '/admin/proposals',
      });
    } catch (error) {
      console.error('Error notifying admins:', error);
    }
  },
};
