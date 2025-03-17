const logger = require('../utils/logger');

// Rate limiting map to prevent spam
const notificationCooldowns = new Map();

module.exports = {
    config: {
        name: "adminNoti",
        version: "1.1.0",
        description: "Send notifications to admins about important events"
    },
    execute: async function ({ api, event, config }) {
        try {
            // Skip if no event type
            if (!event || !event.type) return;
            
            // Get admin UIDs from config
            const adminIds = Array.isArray(config?.admins) ? config.admins : [];
            if (adminIds.length === 0) return;

            // Check event type and create notification message
            let notificationMsg = '';
            
            switch (event.type) {
                case 'event':
                    switch (event.logMessageType) {
                        case 'log:subscribe':
                            const addedParticipants = event.logMessageData.addedParticipants || [];
                            if (addedParticipants.length > 0) {
                                const names = addedParticipants.map(p => p.fullName || 'Unknown').join(', ');
                                notificationMsg = `👥 New member(s) joined:\n${names}\nGroup: ${event.threadID}`;
                            }
                            break;

                        case 'log:unsubscribe':
                            const removedBy = event.author;
                            const target = event.logMessageData.leftParticipantFbId || 
                                         event.logMessageData.participantFbId;
                            
                            if (target) {
                                let actionType = removedBy === target ? "left" : "was removed from";
                                notificationMsg = `👋 User ${target} ${actionType} group ${event.threadID}`;
                                if (removedBy !== target) {
                                    notificationMsg += `\nRemoved by: ${removedBy}`;
                                }
                            }
                            break;

                        case 'log:thread-name':
                            const newName = event.logMessageData.name;
                            notificationMsg = `✏️ Group name changed to "${newName}"\nGroup: ${event.threadID}`;
                            break;
                    }
                    break;

                case 'message_unsend':
                    // Only notify about unsent messages if configured
                    if (config?.notifyMessageUnsend) {
                        notificationMsg = `🗑️ Message unsent in ${event.threadID}\nBy user: ${event.senderID}`;
                    }
                    break;
            }

            // Send notifications if we have a message
            if (notificationMsg) {
                // Check cooldown for this type of notification
                const now = Date.now();
                const cooldownKey = `${event.threadID}_${event.type}`;
                const lastNotification = notificationCooldowns.get(cooldownKey) || 0;
                
                // 5-minute cooldown per thread per event type
                if (now - lastNotification < 5 * 60 * 1000) {
                    return;
                }
                
                // Update cooldown
                notificationCooldowns.set(cooldownKey, now);

                // Send to each admin
                for (const adminId of adminIds) {
                    try {
                        await api.sendMessage(`[ADMIN NOTIFICATION]\n${notificationMsg}`, adminId);
                    } catch (err) {
                        logger.error(`Failed to send admin notification to ${adminId}: ${err.message}`);
                    }
                }
            }
        } catch (error) {
            logger.error('Admin notification error:', error);
        }
    }
};
