import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
admin.initializeApp();

/**
 * Cloud Function triggered when a new user is created in Firebase Auth
 * Sets up user profile in Firestore, sets custom claims based on role,
 * and sends a welcome email
 *
 * Requirements: 1.1 - User Registration and Authentication
 */
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const {uid, email, displayName} = user;

  try {
    // Get user document from Firestore to retrieve role
    const userDoc = await admin.firestore().collection("users").doc(uid).get();

    if (!userDoc.exists) {
      console.error(`User document not found for uid: ${uid}`);
      return;
    }

    const userData = userDoc.data();
    const role = userData?.role;

    if (!role) {
      console.error(`Role not found for user: ${uid}`);
      return;
    }

    // Set custom claims based on role
    await admin.auth().setCustomUserClaims(uid, {
      role: role,
      landlord: role === "landlord",
      tenant: role === "tenant",
      admin: role === "admin",
    });

    console.log(`Custom claims set for user ${uid} with role: ${role}`);

    // Send welcome email
    // Note: In production, you would use a service like SendGrid, Mailgun,
    // or Firebase Extensions for email sending
    // For now, we'll log the email that would be sent
    const welcomeEmail = {
      to: email,
      subject: "Welcome to IKHAYA RENT PROPERTIES",
      text: `Hello ${displayName || "there"},

Welcome to IKHAYA RENT PROPERTIES! We're excited to have you on board.

${role === "landlord" ?
    "As a landlord, you can now start listing your properties and " +
    "connecting with potential tenants." :
    "As a tenant, you can now search for properties and connect with landlords."}

To get started, please verify your email address by clicking the link " +
"we sent to your inbox.

Best regards,
The IKHAYA RENT PROPERTIES Team`,
      html: `
        <h2>Welcome to IKHAYA RENT PROPERTIES!</h2>
        <p>Hello ${displayName || "there"},</p>
        <p>We're excited to have you on board.</p>
        ${role === "landlord" ?
    "<p>As a landlord, you can now start listing your properties and " +
    "connecting with potential tenants.</p>" :
    "<p>As a tenant, you can now search for properties and connect " +
    "with landlords.</p>"}
        <p>To get started, please verify your email address by clicking the " +
        "link we sent to your inbox.</p>
        <p>Best regards,<br>The IKHAYA RENT PROPERTIES Team</p>
      `,
    };

    // TODO: Integrate with email service (SendGrid, Mailgun, etc.)
    // For now, just log the email
    console.log("Welcome email to be sent:", welcomeEmail);

    // In production, you would send the email like this:
    // await sendEmail(welcomeEmail);

    return {
      success: true,
      message: `User ${uid} setup completed successfully`,
    };
  } catch (error) {
    console.error("Error in onUserCreate function:", error);
    // Don't throw error to prevent blocking user creation
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

/**
 * Cloud Function triggered when a user is deleted from Firebase Auth
 * Cleans up user data from Firestore
 */
export const onUserDelete = functions.auth.user().onDelete(async (user) => {
  const {uid} = user;

  try {
    // Delete user document from Firestore
    await admin.firestore().collection("users").doc(uid).delete();

    console.log(`User document deleted for uid: ${uid}`);

    // TODO: Clean up other user-related data
    // - Delete user's properties (if landlord)
    // - Delete user's leads (if tenant)
    // - Delete user's saved properties
    // - etc.

    return {
      success: true,
      message: `User ${uid} data cleaned up successfully`,
    };
  } catch (error) {
    console.error("Error in onUserDelete function:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

/**
 * Cloud Function triggered when a new lead is created
 * Sends notifications to the landlord via email and in-app notification
 *
 * Requirements: 4.1, 4.4 - Lead Generation and Communication
 */
export const onLeadCreate = functions.firestore
  .document("leads/{leadId}")
  .onCreate(async (snapshot, context) => {
    const leadId = context.params.leadId;
    const leadData = snapshot.data();

    try {
      const {tenantId, propertyId, landlordId, initialMessage} = leadData;

      // Get tenant information
      const tenantDoc = await admin
        .firestore()
        .collection("users")
        .doc(tenantId)
        .get();

      if (!tenantDoc.exists) {
        console.error(`Tenant not found: ${tenantId}`);
        return;
      }

      const tenant = tenantDoc.data();

      // Get property information
      const propertyDoc = await admin
        .firestore()
        .collection("properties")
        .doc(propertyId)
        .get();

      if (!propertyDoc.exists) {
        console.error(`Property not found: ${propertyId}`);
        return;
      }

      const property = propertyDoc.data();

      // Get landlord information
      const landlordDoc = await admin
        .firestore()
        .collection("users")
        .doc(landlordId)
        .get();

      if (!landlordDoc.exists) {
        console.error(`Landlord not found: ${landlordId}`);
        return;
      }

      const landlord = landlordDoc.data();

      // Create in-app notification for landlord
      const notification = {
        userId: landlordId,
        type: "new_lead",
        title: "New Property Inquiry",
        message: `${tenant?.name} is interested in your property at ${property?.address}`,
        link: `/leads/${leadId}`,
        priority: "high",
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await admin.firestore().collection("notifications").add(notification);

      console.log(`In-app notification created for landlord ${landlordId}`);

      // Send email notification to landlord
      const emailNotification = {
        to: landlord?.email,
        subject: "New Property Inquiry - IKHAYA RENT PROPERTIES",
        text: `Hello ${landlord?.name},

You have received a new inquiry for your property at ${property?.address}.

Tenant: ${tenant?.name}
Email: ${tenant?.email}
${tenant?.phone ? `Phone: ${tenant?.phone}` : ""}

Message:
${initialMessage}

Please log in to your dashboard to respond to this inquiry.

Best regards,
The IKHAYA RENT PROPERTIES Team`,
        html: `
          <h2>New Property Inquiry</h2>
          <p>Hello ${landlord?.name},</p>
          <p>You have received a new inquiry for your property at <strong>${property?.address}</strong>.</p>
          <h3>Tenant Information:</h3>
          <ul>
            <li><strong>Name:</strong> ${tenant?.name}</li>
            <li><strong>Email:</strong> ${tenant?.email}</li>
            ${tenant?.phone ? `<li><strong>Phone:</strong> ${tenant?.phone}</li>` : ""}
          </ul>
          <h3>Message:</h3>
          <p>${initialMessage}</p>
          <p>Please log in to your dashboard to respond to this inquiry.</p>
          <p>Best regards,<br>The IKHAYA RENT PROPERTIES Team</p>
        `,
      };

      // TODO: Integrate with email service
      console.log("Email notification to be sent:", emailNotification);

      return {
        success: true,
        message: `Notifications sent for lead ${leadId}`,
      };
    } catch (error) {
      console.error("Error in onLeadCreate function:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

/**
 * Cloud Function triggered when a new message is created in a lead
 * Sends notifications to the recipient via email and in-app notification
 *
 * Requirements: 4.4 - Lead Generation and Communication
 */
export const onMessageCreate = functions.firestore
  .document("leads/{leadId}/messages/{messageId}")
  .onCreate(async (snapshot, context) => {
    const leadId = context.params.leadId;
    const messageId = context.params.messageId;
    const messageData = snapshot.data();

    try {
      const {senderId, content} = messageData;

      // Get lead information
      const leadDoc = await admin
        .firestore()
        .collection("leads")
        .doc(leadId)
        .get();

      if (!leadDoc.exists) {
        console.error(`Lead not found: ${leadId}`);
        return;
      }

      const lead = leadDoc.data();
      const {tenantId, landlordId, propertyId} = lead!;

      // Determine recipient (the person who didn't send the message)
      const recipientId = senderId === tenantId ? landlordId : tenantId;

      // Get sender information
      const senderDoc = await admin
        .firestore()
        .collection("users")
        .doc(senderId)
        .get();

      if (!senderDoc.exists) {
        console.error(`Sender not found: ${senderId}`);
        return;
      }

      const sender = senderDoc.data();

      // Get recipient information
      const recipientDoc = await admin
        .firestore()
        .collection("users")
        .doc(recipientId)
        .get();

      if (!recipientDoc.exists) {
        console.error(`Recipient not found: ${recipientId}`);
        return;
      }

      const recipient = recipientDoc.data();

      // Get property information
      const propertyDoc = await admin
        .firestore()
        .collection("properties")
        .doc(propertyId)
        .get();

      if (!propertyDoc.exists) {
        console.error(`Property not found: ${propertyId}`);
        return;
      }

      const property = propertyDoc.data();

      // Create in-app notification for recipient
      const notification = {
        userId: recipientId,
        type: "new_message",
        title: "New Message",
        message: `${sender?.name} sent you a message about ${property?.address}`,
        link: `/leads/${leadId}`,
        priority: "medium",
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await admin.firestore().collection("notifications").add(notification);

      console.log(`In-app notification created for user ${recipientId}`);

      // Send email notification to recipient
      const emailNotification = {
        to: recipient?.email,
        subject: "New Message - IKHAYA RENT PROPERTIES",
        text: `Hello ${recipient?.name},

You have received a new message from ${sender?.name} regarding the property at ${property?.address}.

Message:
${content}

Please log in to your dashboard to respond.

Best regards,
The IKHAYA RENT PROPERTIES Team`,
        html: `
          <h2>New Message</h2>
          <p>Hello ${recipient?.name},</p>
          <p>You have received a new message from <strong>${sender?.name}</strong> regarding the property at <strong>${property?.address}</strong>.</p>
          <h3>Message:</h3>
          <p>${content}</p>
          <p>Please log in to your dashboard to respond.</p>
          <p>Best regards,<br>The IKHAYA RENT PROPERTIES Team</p>
        `,
      };

      // TODO: Integrate with email service
      console.log("Email notification to be sent:", emailNotification);

      return {
        success: true,
        message: `Notifications sent for message ${messageId}`,
      };
    } catch (error) {
      console.error("Error in onMessageCreate function:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

/**
 * Cloud Function triggered when a lease is updated
 * Checks if both parties have signed and activates the lease
 * Updates property status to occupied when lease is activated
 *
 * Requirements: 5.3 - Lease Agreement Management
 */
export const onLeaseUpdate = functions.firestore
  .document("leases/{leaseId}")
  .onUpdate(async (change, context) => {
    const leaseId = context.params.leaseId;
    const beforeData = change.before.data();
    const afterData = change.after.data();

    try {
      // Check if both parties have now signed
      const bothSignedBefore = beforeData.landlordSignature &&
        beforeData.tenantSignature;
      const bothSignedAfter = afterData.landlordSignature &&
        afterData.tenantSignature;

      // If both parties just signed (transition from not both signed to both signed)
      if (!bothSignedBefore && bothSignedAfter &&
        afterData.status === "pending_signatures") {
        console.log(`Both parties signed lease ${leaseId}, activating...`);

        // Update lease status to active
        await admin
          .firestore()
          .collection("leases")
          .doc(leaseId)
          .update({
            status: "active",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

        // Update property status to occupied
        await admin
          .firestore()
          .collection("properties")
          .doc(afterData.propertyId)
          .update({
            status: "occupied",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

        console.log(
          `Lease ${leaseId} activated and property ${afterData.propertyId} marked as occupied`
        );

        // Send notifications to both parties
        const landlordNotification = {
          userId: afterData.landlordId,
          type: "lease_expiring",
          title: "Lease Agreement Activated",
          message: "Your lease agreement has been fully signed and is now active.",
          link: `/leases/${leaseId}`,
          priority: "high",
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const tenantNotification = {
          userId: afterData.tenantId,
          type: "lease_expiring",
          title: "Lease Agreement Activated",
          message: "Your lease agreement has been fully signed and is now active.",
          link: `/leases/${leaseId}`,
          priority: "high",
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        await Promise.all([
          admin.firestore().collection("notifications").add(landlordNotification),
          admin.firestore().collection("notifications").add(tenantNotification),
        ]);

        console.log(`Activation notifications sent for lease ${leaseId}`);
      }

      // Check if lease was terminated
      if (beforeData.status === "active" && afterData.status === "terminated") {
        console.log(`Lease ${leaseId} terminated, updating property status...`);

        // Update property status to available
        await admin
          .firestore()
          .collection("properties")
          .doc(afterData.propertyId)
          .update({
            status: "available",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

        console.log(
          `Property ${afterData.propertyId} marked as available after lease termination`
        );
      }

      return {
        success: true,
        message: `Lease ${leaseId} update processed successfully`,
      };
    } catch (error) {
      console.error("Error in onLeaseUpdate function:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

/**
 * Scheduled Cloud Function that runs daily to check for expiring leases
 * Sends notifications to landlords and tenants 30 days before lease expiration
 *
 * Requirements: 5.4 - Lease Agreement Management
 *
 * Schedule: Runs daily at 9:00 AM UTC
 */
export const checkExpiringLeases = functions.pubsub
  .schedule("0 9 * * *")
  .timeZone("UTC")
  .onRun(async (context) => {
    try {
      console.log("Starting expiring leases check...");

      // Calculate date 30 days from now
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      // Calculate date 31 days from now (to get leases expiring in exactly 30 days)
      const thirtyOneDaysFromNow = new Date();
      thirtyOneDaysFromNow.setDate(thirtyOneDaysFromNow.getDate() + 31);

      // Query for active leases expiring within 30 days
      const expiringLeasesSnapshot = await admin
        .firestore()
        .collection("leases")
        .where("status", "==", "active")
        .where("endDate", ">=", admin.firestore.Timestamp.fromDate(new Date()))
        .where("endDate", "<=", admin.firestore.Timestamp.fromDate(thirtyDaysFromNow))
        .get();

      console.log(`Found ${expiringLeasesSnapshot.size} expiring leases`);

      if (expiringLeasesSnapshot.empty) {
        console.log("No expiring leases found");
        return {
          success: true,
          message: "No expiring leases found",
          count: 0,
        };
      }

      // Process each expiring lease
      const notificationPromises: Promise<any>[] = [];

      for (const leaseDoc of expiringLeasesSnapshot.docs) {
        const lease = leaseDoc.data();
        const leaseId = leaseDoc.id;
        const endDate = lease.endDate.toDate();
        const daysUntilExpiration = Math.ceil(
          (endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        console.log(
          `Processing lease ${leaseId} expiring in ${daysUntilExpiration} days`
        );

        // Get property information
        const propertyDoc = await admin
          .firestore()
          .collection("properties")
          .doc(lease.propertyId)
          .get();

        const property = propertyDoc.exists ? propertyDoc.data() : null;

        // Get landlord information
        const landlordDoc = await admin
          .firestore()
          .collection("users")
          .doc(lease.landlordId)
          .get();

        const landlord = landlordDoc.exists ? landlordDoc.data() : null;

        // Get tenant information
        const tenantDoc = await admin
          .firestore()
          .collection("users")
          .doc(lease.tenantId)
          .get();

        const tenant = tenantDoc.exists ? tenantDoc.data() : null;

        // Create notification for landlord
        const landlordNotification = {
          userId: lease.landlordId,
          type: "lease_expiring",
          title: "Lease Expiring Soon",
          message: `Your lease for ${property?.address || "a property"} expires in ${daysUntilExpiration} days`,
          link: `/leases/${leaseId}`,
          priority: "high",
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        // Create notification for tenant
        const tenantNotification = {
          userId: lease.tenantId,
          type: "lease_expiring",
          title: "Lease Expiring Soon",
          message: `Your lease for ${property?.address || "a property"} expires in ${daysUntilExpiration} days`,
          link: `/leases/${leaseId}`,
          priority: "high",
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        // Add notifications to Firestore
        notificationPromises.push(
          admin.firestore().collection("notifications").add(landlordNotification)
        );
        notificationPromises.push(
          admin.firestore().collection("notifications").add(tenantNotification)
        );

        // Send email notifications
        const landlordEmail = {
          to: landlord?.email,
          subject: "Lease Expiring Soon - IKHAYA RENT PROPERTIES",
          text: `Hello ${landlord?.name},

This is a reminder that your lease for the property at ${property?.address} will expire in ${daysUntilExpiration} days.

Lease Details:
- Property: ${property?.address}
- Tenant: ${tenant?.name}
- End Date: ${endDate.toLocaleDateString()}
- Monthly Rent: R${lease.rentAmount}

Please contact your tenant to discuss lease renewal or make arrangements for the property handover.

Best regards,
The IKHAYA RENT PROPERTIES Team`,
          html: `
            <h2>Lease Expiring Soon</h2>
            <p>Hello ${landlord?.name},</p>
            <p>This is a reminder that your lease for the property at <strong>${property?.address}</strong> will expire in <strong>${daysUntilExpiration} days</strong>.</p>
            <h3>Lease Details:</h3>
            <ul>
              <li><strong>Property:</strong> ${property?.address}</li>
              <li><strong>Tenant:</strong> ${tenant?.name}</li>
              <li><strong>End Date:</strong> ${endDate.toLocaleDateString()}</li>
              <li><strong>Monthly Rent:</strong> R${lease.rentAmount}</li>
            </ul>
            <p>Please contact your tenant to discuss lease renewal or make arrangements for the property handover.</p>
            <p>Best regards,<br>The IKHAYA RENT PROPERTIES Team</p>
          `,
        };

        const tenantEmail = {
          to: tenant?.email,
          subject: "Lease Expiring Soon - IKHAYA RENT PROPERTIES",
          text: `Hello ${tenant?.name},

This is a reminder that your lease for the property at ${property?.address} will expire in ${daysUntilExpiration} days.

Lease Details:
- Property: ${property?.address}
- Landlord: ${landlord?.name}
- End Date: ${endDate.toLocaleDateString()}
- Monthly Rent: R${lease.rentAmount}

Please contact your landlord to discuss lease renewal or make arrangements for moving out.

Best regards,
The IKHAYA RENT PROPERTIES Team`,
          html: `
            <h2>Lease Expiring Soon</h2>
            <p>Hello ${tenant?.name},</p>
            <p>This is a reminder that your lease for the property at <strong>${property?.address}</strong> will expire in <strong>${daysUntilExpiration} days</strong>.</p>
            <h3>Lease Details:</h3>
            <ul>
              <li><strong>Property:</strong> ${property?.address}</li>
              <li><strong>Landlord:</strong> ${landlord?.name}</li>
              <li><strong>End Date:</strong> ${endDate.toLocaleDateString()}</li>
              <li><strong>Monthly Rent:</strong> R${lease.rentAmount}</li>
            </ul>
            <p>Please contact your landlord to discuss lease renewal or make arrangements for moving out.</p>
            <p>Best regards,<br>The IKHAYA RENT PROPERTIES Team</p>
          `,
        };

        // TODO: Integrate with email service
        console.log("Landlord email to be sent:", landlordEmail);
        console.log("Tenant email to be sent:", tenantEmail);
      }

      // Wait for all notifications to be created
      await Promise.all(notificationPromises);

      console.log(
        `Expiring lease notifications sent for ${expiringLeasesSnapshot.size} leases`
      );

      return {
        success: true,
        message: `Processed ${expiringLeasesSnapshot.size} expiring leases`,
        count: expiringLeasesSnapshot.size,
      };
    } catch (error) {
      console.error("Error in checkExpiringLeases function:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

/**
 * Cloud Function triggered when a maintenance request is created
 * Sends notifications to the landlord via email and in-app notification
 *
 * Requirements: 6.1, 6.5 - Maintenance Request Management
 */
export const onMaintenanceRequestCreate = functions.firestore
  .document("maintenance/{requestId}")
  .onCreate(async (snapshot, context) => {
    const requestId = context.params.requestId;
    const requestData = snapshot.data();

    try {
      const {tenantId, landlordId, propertyId, category, priority, description} = requestData;

      // Get tenant information
      const tenantDoc = await admin
        .firestore()
        .collection("users")
        .doc(tenantId)
        .get();

      if (!tenantDoc.exists) {
        console.error(`Tenant not found: ${tenantId}`);
        return;
      }

      const tenant = tenantDoc.data();

      // Get property information
      const propertyDoc = await admin
        .firestore()
        .collection("properties")
        .doc(propertyId)
        .get();

      if (!propertyDoc.exists) {
        console.error(`Property not found: ${propertyId}`);
        return;
      }

      const property = propertyDoc.data();

      // Get landlord information
      const landlordDoc = await admin
        .firestore()
        .collection("users")
        .doc(landlordId)
        .get();

      if (!landlordDoc.exists) {
        console.error(`Landlord not found: ${landlordId}`);
        return;
      }

      const landlord = landlordDoc.data();

      // Create in-app notification for landlord
      const notification = {
        userId: landlordId,
        type: "maintenance_request",
        title: "New Maintenance Request",
        message: `${tenant?.name} submitted a ${priority} priority ${category} request for ${property?.address}`,
        link: `/maintenance/${requestId}`,
        priority: priority === "urgent" ? "high" : "medium",
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await admin.firestore().collection("notifications").add(notification);

      console.log(`In-app notification created for landlord ${landlordId}`);

      // Send email notification to landlord
      const emailNotification = {
        to: landlord?.email,
        subject: `New Maintenance Request - ${priority.toUpperCase()} Priority`,
        text: `Hello ${landlord?.name},

A new maintenance request has been submitted for your property at ${property?.address}.

Request Details:
- Category: ${category}
- Priority: ${priority}
- Tenant: ${tenant?.name}
- Description: ${description}

Please log in to your dashboard to review and respond to this request.

Best regards,
The IKHAYA RENT PROPERTIES Team`,
        html: `
          <h2>New Maintenance Request</h2>
          <p>Hello ${landlord?.name},</p>
          <p>A new maintenance request has been submitted for your property at <strong>${property?.address}</strong>.</p>
          <h3>Request Details:</h3>
          <ul>
            <li><strong>Category:</strong> ${category}</li>
            <li><strong>Priority:</strong> <span style="color: ${priority === "urgent" ? "red" : priority === "high" ? "orange" : "black"}">${priority}</span></li>
            <li><strong>Tenant:</strong> ${tenant?.name}</li>
            <li><strong>Description:</strong> ${description}</li>
          </ul>
          <p>Please log in to your dashboard to review and respond to this request.</p>
          <p>Best regards,<br>The IKHAYA RENT PROPERTIES Team</p>
        `,
      };

      // TODO: Integrate with email service
      console.log("Email notification to be sent:", emailNotification);

      return {
        success: true,
        message: `Notifications sent for maintenance request ${requestId}`,
      };
    } catch (error) {
      console.error("Error in onMaintenanceRequestCreate function:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

/**
 * Cloud Function triggered when a maintenance request status is updated
 * Sends notifications to the tenant via email and in-app notification
 *
 * Requirements: 6.5 - Maintenance Request Management
 */
export const onMaintenanceRequestUpdate = functions.firestore
  .document("maintenance/{requestId}")
  .onUpdate(async (change, context) => {
    const requestId = context.params.requestId;
    const beforeData = change.before.data();
    const afterData = change.after.data();

    try {
      // Check if status changed
      if (beforeData.status === afterData.status) {
        console.log(`No status change for maintenance request ${requestId}`);
        return {
          success: true,
          message: "No status change, no notification needed",
        };
      }

      const {tenantId, propertyId, status} = afterData;

      // Get tenant information
      const tenantDoc = await admin
        .firestore()
        .collection("users")
        .doc(tenantId)
        .get();

      if (!tenantDoc.exists) {
        console.error(`Tenant not found: ${tenantId}`);
        return;
      }

      const tenant = tenantDoc.data();

      // Get property information
      const propertyDoc = await admin
        .firestore()
        .collection("properties")
        .doc(propertyId)
        .get();

      if (!propertyDoc.exists) {
        console.error(`Property not found: ${propertyId}`);
        return;
      }

      const property = propertyDoc.data();

      // Create status message
      let statusMessage = "";
      switch (status) {
        case "in_progress":
          statusMessage = "is now being worked on";
          break;
        case "completed":
          statusMessage = "has been completed";
          break;
        case "cancelled":
          statusMessage = "has been cancelled";
          break;
        default:
          statusMessage = `status has been updated to ${status}`;
      }

      // Create in-app notification for tenant
      const notification = {
        userId: tenantId,
        type: "maintenance_request",
        title: "Maintenance Request Update",
        message: `Your maintenance request for ${property?.address} ${statusMessage}`,
        link: `/maintenance/${requestId}`,
        priority: "medium",
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await admin.firestore().collection("notifications").add(notification);

      console.log(`In-app notification created for tenant ${tenantId}`);

      // Send email notification to tenant
      const emailNotification = {
        to: tenant?.email,
        subject: "Maintenance Request Update - IKHAYA RENT PROPERTIES",
        text: `Hello ${tenant?.name},

Your maintenance request for the property at ${property?.address} ${statusMessage}.

Request Status: ${status}

Please log in to your dashboard to view the details.

Best regards,
The IKHAYA RENT PROPERTIES Team`,
        html: `
          <h2>Maintenance Request Update</h2>
          <p>Hello ${tenant?.name},</p>
          <p>Your maintenance request for the property at <strong>${property?.address}</strong> ${statusMessage}.</p>
          <p><strong>Request Status:</strong> ${status}</p>
          <p>Please log in to your dashboard to view the details.</p>
          <p>Best regards,<br>The IKHAYA RENT PROPERTIES Team</p>
        `,
      };

      // TODO: Integrate with email service
      console.log("Email notification to be sent:", emailNotification);

      return {
        success: true,
        message: `Notifications sent for maintenance request ${requestId} status update`,
      };
    } catch (error) {
      console.error("Error in onMaintenanceRequestUpdate function:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

/**
 * Scheduled Cloud Function that runs daily to delete old notifications
 * Deletes notifications older than 90 days
 *
 * Requirements: 11.6 - Notification System
 *
 * Schedule: Runs daily at 2:00 AM UTC
 */
export const deleteOldNotifications = functions.pubsub
  .schedule("0 2 * * *")
  .timeZone("UTC")
  .onRun(async () => {
    try {
      console.log("Starting old notifications cleanup...");

      // Calculate date 90 days ago
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      // Query for notifications older than 90 days
      const oldNotificationsSnapshot = await admin
        .firestore()
        .collection("notifications")
        .where("createdAt", "<=", admin.firestore.Timestamp.fromDate(ninetyDaysAgo))
        .get();

      console.log(`Found ${oldNotificationsSnapshot.size} old notifications to delete`);

      if (oldNotificationsSnapshot.empty) {
        console.log("No old notifications found");
        return {
          success: true,
          message: "No old notifications to delete",
          count: 0,
        };
      }

      // Delete notifications in batches (Firestore limit is 500 per batch)
      const batchSize = 500;
      let deletedCount = 0;

      for (let i = 0; i < oldNotificationsSnapshot.docs.length; i += batchSize) {
        const batch = admin.firestore().batch();
        const batchDocs = oldNotificationsSnapshot.docs.slice(i, i + batchSize);

        batchDocs.forEach((doc) => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        deletedCount += batchDocs.length;

        console.log(`Deleted batch of ${batchDocs.length} notifications`);
      }

      console.log(`Successfully deleted ${deletedCount} old notifications`);

      return {
        success: true,
        message: `Deleted ${deletedCount} old notifications`,
        count: deletedCount,
      };
    } catch (error) {
      console.error("Error in deleteOldNotifications function:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

/**
 * Callable Cloud Function to send email notifications based on user preferences
 * Checks user preferences before sending email
 *
 * Requirements: 11.1, 11.2 - Notification System
 */
export const sendEmailNotification = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated to send notifications"
    );
  }

  const {userId, type, subject, text, html} = data;

  try {
    // Validate required fields
    if (!userId || !type || !subject || !text) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required fields: userId, type, subject, text"
      );
    }

    // Get user preferences
    const preferencesDoc = await admin
      .firestore()
      .collection("userPreferences")
      .doc(userId)
      .get();

    let preferences;
    if (preferencesDoc.exists) {
      preferences = preferencesDoc.data();
    } else {
      // Default preferences: email enabled
      preferences = {
        notifications: {
          email: true,
          sms: false,
          inApp: true,
          types: {
            new_lead: true,
            new_message: true,
            maintenance_request: true,
            lease_expiring: true,
            payment_due: true,
            payment_received: true,
            listing_approved: true,
          },
        },
      };
    }

    // Check if email notifications are enabled
    if (!preferences?.notifications?.email) {
      console.log(`Email notifications disabled for user ${userId}`);
      return {
        success: false,
        message: "Email notifications are disabled for this user",
      };
    }

    // Check if this notification type is enabled
    if (preferences?.notifications?.types && !preferences.notifications.types[type]) {
      console.log(`Email notifications for type ${type} disabled for user ${userId}`);
      return {
        success: false,
        message: `Email notifications for type ${type} are disabled for this user`,
      };
    }

    // Get user email
    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError("not-found", "User not found");
    }

    const user = userDoc.data();
    const email = user?.email;

    if (!email) {
      throw new functions.https.HttpsError("not-found", "User email not found");
    }

    // Prepare email
    const emailData = {
      to: email,
      subject,
      text,
      html: html || text,
    };

    // TODO: Integrate with email service (SendGrid, Mailgun, etc.)
    console.log("Email to be sent:", emailData);

    return {
      success: true,
      message: "Email notification sent successfully",
      email: email,
    };
  } catch (error) {
    console.error("Error in sendEmailNotification function:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
});

/**
 * Callable Cloud Function to create grouped notifications
 * Groups similar notifications to avoid overwhelming users
 *
 * Requirements: 11.4 - Notification System
 */
export const createGroupedNotification = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated to create notifications"
    );
  }

  const {userId, type, notifications} = data;

  try {
    // Validate required fields
    if (!userId || !type || !notifications || !Array.isArray(notifications)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required fields: userId, type, notifications (array)"
      );
    }

    // Check if there are recent similar notifications (within last hour)
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const recentNotificationsSnapshot = await admin
      .firestore()
      .collection("notifications")
      .where("userId", "==", userId)
      .where("type", "==", type)
      .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(oneHourAgo))
      .where("read", "==", false)
      .get();

    if (!recentNotificationsSnapshot.empty) {
      // Update existing notification with grouped count
      const existingNotification = recentNotificationsSnapshot.docs[0];
      const existingData = existingNotification.data();

      const groupedCount = (existingData.groupedCount || 1) + notifications.length;

      await existingNotification.ref.update({
        message: `You have ${groupedCount} new ${type.replace(/_/g, " ")} notifications`,
        groupedCount,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Updated grouped notification for user ${userId}, type ${type}`);

      return {
        success: true,
        message: "Notification grouped with existing notification",
        notificationId: existingNotification.id,
        groupedCount,
      };
    } else {
      // Create new grouped notification
      const groupedNotification = {
        userId,
        type,
        title: notifications[0].title || `New ${type.replace(/_/g, " ")}`,
        message: notifications.length > 1 ?
          `You have ${notifications.length} new ${type.replace(/_/g, " ")} notifications` :
          notifications[0].message,
        link: notifications[0].link,
        priority: notifications[0].priority || "medium",
        read: false,
        groupedCount: notifications.length,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const notificationRef = await admin
        .firestore()
        .collection("notifications")
        .add(groupedNotification);

      console.log(`Created grouped notification for user ${userId}, type ${type}`);

      return {
        success: true,
        message: "Grouped notification created successfully",
        notificationId: notificationRef.id,
        groupedCount: notifications.length,
      };
    }
  } catch (error) {
    console.error("Error in createGroupedNotification function:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
});

/**
 * Scheduled Cloud Function that runs monthly to generate commission invoices
 * Generates invoices for all landlords with active leases
 *
 * Requirements: 8.2 - Commission and Payment Tracking
 *
 * Schedule: Runs on the 1st of every month at 9:00 AM UTC
 */
export const generateMonthlyInvoices = functions.pubsub
  .schedule("0 9 1 * *")
  .timeZone("UTC")
  .onRun(async (context) => {
    try {
      console.log("Starting monthly invoice generation...");

      // Get all active leases
      const activeLeasesSnapshot = await admin
        .firestore()
        .collection("leases")
        .where("status", "==", "active")
        .get();

      console.log(`Found ${activeLeasesSnapshot.size} active leases`);

      if (activeLeasesSnapshot.empty) {
        console.log("No active leases found");
        return {
          success: true,
          message: "No active leases found",
          count: 0,
        };
      }

      // Group leases by landlord
      const leasesByLandlord = new Map<string, any[]>();

      activeLeasesSnapshot.docs.forEach((doc) => {
        const lease = doc.data();
        const landlordId = lease.landlordId;

        if (!leasesByLandlord.has(landlordId)) {
          leasesByLandlord.set(landlordId, []);
        }

        leasesByLandlord.get(landlordId)!.push({
          id: doc.id,
          ...lease,
        });
      });

      console.log(`Generating invoices for ${leasesByLandlord.size} landlords`);

      // Commission rate (10%)
      const COMMISSION_RATE = 0.10;

      // Generate invoice for each landlord
      const invoicePromises: Promise<any>[] = [];

      for (const [landlordId, leases] of leasesByLandlord.entries()) {
        // Calculate commission for each lease and build invoice items
        const items: any[] = [];
        let totalAmount = 0;

        for (const lease of leases) {
          const commission = lease.rentAmount * COMMISSION_RATE;

          items.push({
            leaseId: lease.id,
            description: `Commission for property ${lease.propertyId}`,
            amount: commission,
          });

          totalAmount += commission;
        }

        // Calculate due date (15 days from invoice creation)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 15);

        // Create invoice document
        const invoice = {
          landlordId,
          amount: totalAmount,
          dueDate: admin.firestore.Timestamp.fromDate(dueDate),
          status: "pending",
          leaseIds: leases.map((lease) => lease.id),
          items,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        // Save invoice to Firestore
        const invoicePromise = admin
          .firestore()
          .collection("invoices")
          .add(invoice)
          .then(async (invoiceRef) => {
            console.log(`Invoice ${invoiceRef.id} created for landlord ${landlordId}`);

            // Create notification for landlord
            const notification = {
              userId: landlordId,
              type: "payment_due",
              title: "New Commission Invoice",
              message: `Your monthly commission invoice of R${totalAmount.toFixed(2)} is now due`,
              link: `/invoices/${invoiceRef.id}`,
              priority: "high",
              read: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            };

            await admin.firestore().collection("notifications").add(notification);

            // Get landlord information for email
            const landlordDoc = await admin
              .firestore()
              .collection("users")
              .doc(landlordId)
              .get();

            if (landlordDoc.exists) {
              const landlord = landlordDoc.data();

              // Send email notification
              const emailNotification = {
                to: landlord?.email,
                subject: "Monthly Commission Invoice - IKHAYA RENT PROPERTIES",
                text: `Hello ${landlord?.name},

Your monthly commission invoice has been generated.

Invoice Details:
- Amount: R${totalAmount.toFixed(2)}
- Due Date: ${dueDate.toLocaleDateString()}
- Number of Properties: ${items.length}

Please log in to your dashboard to view the invoice details and make payment.

Best regards,
The IKHAYA RENT PROPERTIES Team`,
                html: `
                  <h2>Monthly Commission Invoice</h2>
                  <p>Hello ${landlord?.name},</p>
                  <p>Your monthly commission invoice has been generated.</p>
                  <h3>Invoice Details:</h3>
                  <ul>
                    <li><strong>Amount:</strong> R${totalAmount.toFixed(2)}</li>
                    <li><strong>Due Date:</strong> ${dueDate.toLocaleDateString()}</li>
                    <li><strong>Number of Properties:</strong> ${items.length}</li>
                  </ul>
                  <p>Please log in to your dashboard to view the invoice details and make payment.</p>
                  <p>Best regards,<br>The IKHAYA RENT PROPERTIES Team</p>
                `,
              };

              // TODO: Integrate with email service
              console.log("Email notification to be sent:", emailNotification);
            }

            return invoiceRef.id;
          });

        invoicePromises.push(invoicePromise);
      }

      // Wait for all invoices to be created
      const invoiceIds = await Promise.all(invoicePromises);

      console.log(`Successfully generated ${invoiceIds.length} invoices`);

      return {
        success: true,
        message: `Generated ${invoiceIds.length} invoices`,
        count: invoiceIds.length,
        invoiceIds,
      };
    } catch (error) {
      console.error("Error in generateMonthlyInvoices function:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

/**
 * Scheduled Cloud Function that runs daily to send overdue payment reminders
 * Sends reminders for invoices that are 15 or more days past due date
 *
 * Requirements: 8.5 - Commission and Payment Tracking
 *
 * Schedule: Runs daily at 10:00 AM UTC
 */
export const sendOverduePaymentReminders = functions.pubsub
  .schedule("0 10 * * *")
  .timeZone("UTC")
  .onRun(async (context) => {
    try {
      console.log("Starting overdue payment reminders check...");

      // Calculate date 15 days ago
      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

      // Query for pending invoices with due date 15+ days ago
      const overdueInvoicesSnapshot = await admin
        .firestore()
        .collection("invoices")
        .where("status", "==", "pending")
        .where("dueDate", "<=", admin.firestore.Timestamp.fromDate(fifteenDaysAgo))
        .get();

      console.log(`Found ${overdueInvoicesSnapshot.size} overdue invoices`);

      if (overdueInvoicesSnapshot.empty) {
        console.log("No overdue invoices found");
        return {
          success: true,
          message: "No overdue invoices found",
          count: 0,
        };
      }

      // Update invoice status to overdue and send reminders
      const reminderPromises: Promise<any>[] = [];

      for (const invoiceDoc of overdueInvoicesSnapshot.docs) {
        const invoice = invoiceDoc.data();
        const invoiceId = invoiceDoc.id;
        const landlordId = invoice.landlordId;
        const dueDate = invoice.dueDate.toDate();
        const daysOverdue = Math.ceil(
          (Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        console.log(
          `Processing overdue invoice ${invoiceId} for landlord ${landlordId} (${daysOverdue} days overdue)`
        );

        // Update invoice status to overdue
        await invoiceDoc.ref.update({
          status: "overdue",
        });

        // Get landlord information
        const landlordDoc = await admin
          .firestore()
          .collection("users")
          .doc(landlordId)
          .get();

        if (!landlordDoc.exists) {
          console.error(`Landlord not found: ${landlordId}`);
          continue;
        }

        const landlord = landlordDoc.data();

        // Create notification for landlord
        const notification = {
          userId: landlordId,
          type: "payment_due",
          title: "Overdue Payment Reminder",
          message: `Your commission payment of R${invoice.amount.toFixed(2)} is ${daysOverdue} days overdue`,
          link: `/invoices/${invoiceId}`,
          priority: "high",
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        reminderPromises.push(
          admin.firestore().collection("notifications").add(notification)
        );

        // Send email reminder
        const emailReminder = {
          to: landlord?.email,
          subject: "Overdue Payment Reminder - IKHAYA RENT PROPERTIES",
          text: `Hello ${landlord?.name},

This is a reminder that your commission payment is overdue.

Invoice Details:
- Amount: R${invoice.amount.toFixed(2)}
- Due Date: ${dueDate.toLocaleDateString()}
- Days Overdue: ${daysOverdue}

Please make payment as soon as possible to avoid any service interruptions.

Best regards,
The IKHAYA RENT PROPERTIES Team`,
          html: `
            <h2>Overdue Payment Reminder</h2>
            <p>Hello ${landlord?.name},</p>
            <p>This is a reminder that your commission payment is <strong style="color: red;">overdue</strong>.</p>
            <h3>Invoice Details:</h3>
            <ul>
              <li><strong>Amount:</strong> R${invoice.amount.toFixed(2)}</li>
              <li><strong>Due Date:</strong> ${dueDate.toLocaleDateString()}</li>
              <li><strong>Days Overdue:</strong> <span style="color: red;">${daysOverdue}</span></li>
            </ul>
            <p>Please make payment as soon as possible to avoid any service interruptions.</p>
            <p>Best regards,<br>The IKHAYA RENT PROPERTIES Team</p>
          `,
        };

        // TODO: Integrate with email service
        console.log("Email reminder to be sent:", emailReminder);
      }

      // Wait for all notifications to be created
      await Promise.all(reminderPromises);

      console.log(
        `Sent overdue payment reminders for ${overdueInvoicesSnapshot.size} invoices`
      );

      return {
        success: true,
        message: `Sent reminders for ${overdueInvoicesSnapshot.size} overdue invoices`,
        count: overdueInvoicesSnapshot.size,
      };
    } catch (error) {
      console.error("Error in sendOverduePaymentReminders function:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

/**
 * Cloud Function triggered when a payment is created
 * Updates invoice status and sends confirmation notification
 *
 * Requirements: 8.3 - Commission and Payment Tracking
 */
export const onPaymentCreate = functions.firestore
  .document("payments/{paymentId}")
  .onCreate(async (snapshot, context) => {
    const paymentId = context.params.paymentId;
    const paymentData = snapshot.data();

    try {
      const {invoiceId, landlordId, amount} = paymentData;

      console.log(`Processing payment ${paymentId} for invoice ${invoiceId}`);

      // Get invoice
      const invoiceDoc = await admin
        .firestore()
        .collection("invoices")
        .doc(invoiceId)
        .get();

      if (!invoiceDoc.exists) {
        console.error(`Invoice not found: ${invoiceId}`);
        return;
      }

      const invoice = invoiceDoc.data();

      // Get all payments for this invoice
      const paymentsSnapshot = await admin
        .firestore()
        .collection("payments")
        .where("invoiceId", "==", invoiceId)
        .get();

      // Calculate total paid
      let totalPaid = 0;
      paymentsSnapshot.docs.forEach((doc) => {
        const payment = doc.data();
        totalPaid += payment.amount;
      });

      console.log(
        `Total paid for invoice ${invoiceId}: R${totalPaid} / R${invoice?.amount}`
      );

      // Update invoice status if fully paid
      if (totalPaid >= (invoice?.amount || 0)) {
        await invoiceDoc.ref.update({
          status: "paid",
        });

        console.log(`Invoice ${invoiceId} marked as paid`);
      }

      // Get landlord information
      const landlordDoc = await admin
        .firestore()
        .collection("users")
        .doc(landlordId)
        .get();

      if (!landlordDoc.exists) {
        console.error(`Landlord not found: ${landlordId}`);
        return;
      }

      const landlord = landlordDoc.data();

      // Create notification for landlord
      const notification = {
        userId: landlordId,
        type: "payment_received",
        title: "Payment Received",
        message: `Your payment of R${amount.toFixed(2)} has been received and recorded`,
        link: `/invoices/${invoiceId}`,
        priority: "medium",
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await admin.firestore().collection("notifications").add(notification);

      console.log(`Payment confirmation notification created for landlord ${landlordId}`);

      // Send email confirmation
      const emailConfirmation = {
        to: landlord?.email,
        subject: "Payment Received - IKHAYA RENT PROPERTIES",
        text: `Hello ${landlord?.name},

We have received your payment.

Payment Details:
- Amount: R${amount.toFixed(2)}
- Payment Method: ${paymentData.paymentMethod}
- Reference: ${paymentData.reference}
- Date: ${paymentData.paymentDate.toDate().toLocaleDateString()}

${totalPaid >= (invoice?.amount || 0) ?
    "Your invoice has been fully paid. Thank you!" :
    `Remaining balance: R${((invoice?.amount || 0) - totalPaid).toFixed(2)}`}

Thank you for your payment.

Best regards,
The IKHAYA RENT PROPERTIES Team`,
        html: `
          <h2>Payment Received</h2>
          <p>Hello ${landlord?.name},</p>
          <p>We have received your payment.</p>
          <h3>Payment Details:</h3>
          <ul>
            <li><strong>Amount:</strong> R${amount.toFixed(2)}</li>
            <li><strong>Payment Method:</strong> ${paymentData.paymentMethod}</li>
            <li><strong>Reference:</strong> ${paymentData.reference}</li>
            <li><strong>Date:</strong> ${paymentData.paymentDate.toDate().toLocaleDateString()}</li>
          </ul>
          ${totalPaid >= (invoice?.amount || 0) ?
    "<p><strong style=\"color: green;\">Your invoice has been fully paid. Thank you!</strong></p>" :
    `<p><strong>Remaining balance:</strong> R${((invoice?.amount || 0) - totalPaid).toFixed(2)}</p>`}
          <p>Thank you for your payment.</p>
          <p>Best regards,<br>The IKHAYA RENT PROPERTIES Team</p>
        `,
      };

      // TODO: Integrate with email service
      console.log("Email confirmation to be sent:", emailConfirmation);

      return {
        success: true,
        message: `Payment ${paymentId} processed successfully`,
      };
    } catch (error) {
      console.error("Error in onPaymentCreate function:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });
