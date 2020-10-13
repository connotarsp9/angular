/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * @fileoverview
 * A module to facilitate use of a Trusted Types policy internally within
 * Angular. It lazily constructs the Trusted Types policy, providing helper
 * utilities for promoting strings to Trusted Types. When Trusted Types are not
 * available, strings are used as a fallback.
 * @security All use of this module is security-sensitive and should go through
 * security review.
 */

import {global} from '../global';

/**
 * The Trusted Types policy, or null if Trusted Types are not
 * enabled/supported, or undefined if the policy has not been created yet.
 */
let policy: TrustedTypePolicy|null|undefined;

/**
 * Returns the Trusted Types policy, or null if Trusted Types are not
 * enabled/supported. The first call to this function will create the policy.
 */
function getPolicy(): TrustedTypePolicy|null {
  if (policy === undefined) {
    policy = null;
    if (global.trustedTypes) {
      try {
        policy = (global.trustedTypes as TrustedTypePolicyFactory).createPolicy('angular', {
          createHTML: (s: string) => s,
          createScript: (s: string) => s,
          createScriptURL: (s: string) => s,
        });
      } catch {
        // trustedTypes.createPolicy throws if called with a name that is
        // already registered, even in report-only mode. Until the API changes,
        // catch the error not to break the applications functionally. In such
        // cases, the code will fall back to using strings.
      }
    }
  }
  return policy;
}

/**
 * Unsafely promote a string to a TrustedHTML, falling back to strings when
 * Trusted Types are not available.
 * @security This is a security-sensitive function; any use of this function
 * must go through security review. In particular, it must be assured that the
 * provided string will never cause an XSS vulnerability if used in a context
 * that will be interpreted as HTML by a browser, e.g. when assigning to
 * element.innerHTML.
 */
export function trustedHTMLFromString(html: string): TrustedHTML|string {
  return getPolicy()?.createHTML(html) || html;
}

/**
 * Unsafely promote a string to a TrustedScript, falling back to strings when
 * Trusted Types are not available.
 * @security In particular, it must be assured that the provided string will
 * never cause an XSS vulnerability if used in a context that will be
 * interpreted and executed as a script by a browser, e.g. when calling eval.
 */
export function trustedScriptFromString(script: string): TrustedScript|string {
  return getPolicy()?.createScript(script) || script;
}

/**
 * Unsafely promote a string to a TrustedScriptURL, falling back to strings
 * when Trusted Types are not available.
 * @security This is a security-sensitive function; any use of this function
 * must go through security review. In particular, it must be assured that the
 * provided string will never cause an XSS vulnerability if used in a context
 * that will cause a browser to load and execute a resource, e.g. when
 * assigning to script.src.
 */
export function trustedScriptURLFromString(url: string): TrustedScriptURL|string {
  return getPolicy()?.createScriptURL(url) || url;
}
