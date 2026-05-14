import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  doc, 
  increment, 
  updateDoc, 
  getDocs, 
  query, 
  where,
  getDoc,
  runTransaction,
  limit
} from 'firebase/firestore';
import { SubmissionType, Campaign } from '../types';

export const validateTwitterLink = (link: string) => {
  const twitterRegex = /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/status\/[0-9]+(\?.*)?$/;
  return twitterRegex.test(link);
};

export const submitEngagement = async (
  userId: string, 
  link: string, 
  type: SubmissionType, 
  campaignId?: string
) => {
  const cleanLink = link.trim();

  // 1. Uniqueness Check (First line of defense)
  const duplicateCheck = query(collection(db, 'submissions'), where('link', '==', cleanLink), limit(1));
  const duplicateSnapshot = await getDocs(duplicateCheck);
  if (!duplicateSnapshot.empty) {
    throw new Error('DUPLICATE_LINK');
  }

  return await runTransaction(db, async (transaction) => {
    let pointsToEarn = type === 'tweet' ? 2 : 1;
    let campaignData: Campaign | null = null;

    if (campaignId) {
      const campaignRef = doc(db, 'campaigns', campaignId);
      const campaignSnap = await transaction.get(campaignRef);
      
      if (!campaignSnap.exists()) throw new Error('CAMPAIGN_NOT_FOUND');
      
      campaignData = { id: campaignSnap.id, ...campaignSnap.data() } as Campaign;
      
      if (!campaignData.active) throw new Error('CAMPAIGN_INACTIVE');
      
      if (campaignData.maxEntries && campaignData.currentEntries >= campaignData.maxEntries) {
        throw new Error('CAMPAIGN_LIMIT_REACHED');
      }

      if (type === 'reply') {
        pointsToEarn = campaignData.pointsPerReply;
      }
    }

    // 2. Add Submission
    const submissionRef = doc(collection(db, 'submissions'));
    transaction.set(submissionRef, {
      userId,
      link: cleanLink,
      type,
      pointsEarned: pointsToEarn,
      campaignId: campaignId || null,
      createdAt: serverTimestamp(),
      status: 'verified',
    });

    // 3. Update User Points
    const userRef = doc(db, 'users', userId);
    transaction.update(userRef, {
      points: increment(pointsToEarn),
      updatedAt: serverTimestamp(),
    });

    // 4. Update Campaign Stats if applicable
    if (campaignId && campaignData) {
      const campaignRef = doc(db, 'campaigns', campaignId);
      const newEntries = campaignData.currentEntries + 1;
      const shouldDeactivate = campaignData.maxEntries ? newEntries >= campaignData.maxEntries : false;
      
      transaction.update(campaignRef, {
        currentEntries: increment(1),
        active: !shouldDeactivate
      });
    }

    return { pointsEarned: pointsToEarn };
  });
};
