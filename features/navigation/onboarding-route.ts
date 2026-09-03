import type { Href } from 'expo-router';

/**
 * Shared onboarding entry point, referenced from every screen's
 * `!currentUser` redirect guard. `/onboarding` is a flat route (see
 * app/onboarding.tsx) precisely so it exports as `onboarding.html` on the
 * static web build rather than `onboarding/index.html` -- a directory-style
 * route bare-path request 404s on EAS Hosting's static file server, only
 * `/onboarding/profile` used to force that directory shape.
 */
export const onboardingRoute: Href = '/onboarding';
