'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

const SubscribeSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
});

export async function subscribeToNewsletter(prevState: any, formData: FormData) {
  const validatedFields = SubscribeSchema.safeParse({
    email: formData.get('email'),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors.email?.[0] || "Invalid input."
    };
  }

  const { email } = validatedFields.data;

  try {
    const subscriptionsRef = collection(db, 'subscriptions');
    const q = query(subscriptionsRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return { error: 'This email is already subscribed.' };
    }

    await addDoc(subscriptionsRef, {
      email: email,
      subscribedAt: new Date(),
    });
    return { success: 'Thank you for subscribing! We will keep you updated.' };
  } catch (e) {
    console.error("Error adding document: ", e);
    return { error: 'Something went wrong. Please try again.' };
  }
}
