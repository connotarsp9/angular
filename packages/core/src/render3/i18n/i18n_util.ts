/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {assertEqual, throwError} from '../../util/assert';
import {assertTIcu, assertTNode} from '../assert';
import {createTNodeAtIndex} from '../instructions/shared';
import {TIcu} from '../interfaces/i18n';
import {TIcuContainerNode, TNode, TNodeType} from '../interfaces/node';
import {TView} from '../interfaces/view';
import {assertTNodeType} from '../node_assert';
import {addTNodeAndUpdateInsertBeforeIndex} from './i18n_insert_before_index';


/**
 * Retrieve `TIcu` at a given `index`.
 *
 * The `TIcu` can be stored either directly (if it is nested ICU) OR
 * it is stored inside tho `TIcuContainer` if it is top level ICU.
 *
 * The reason for this is that the top level ICU need a `TNode` so that they are part of the render
 * tree, but nested ICU's have no TNode, because we don't know ahead of time if the nested ICU is
 * expressed (parent ICU may have selected a case which does not contain it.)
 *
 * @param tView Current `TView`.
 * @param index Index where the value should be read from.
 */
export function getTIcu(tView: TView, index: number): TIcu|null {
  const value = tView.data[index] as null | TIcu | TIcuContainerNode | string;
  if (value === null || typeof value === 'string') return null;
  if (ngDevMode &&
      !(value.hasOwnProperty('tViews') || value.hasOwnProperty('currentCaseLViewIndex'))) {
    throwError('We expect to get \'null\'|\'TIcu\'|\'TIcuContainer\', but got: ' + value);
  }
  // Here the `value.hasOwnProperty('currentCaseLViewIndex')` is a polymorphic read as it can be
  // either TIcu or TIcuContainerNode. This is not ideal, but we still think it is OK because it
  // will be just two cases which fits into the browser inline cache (inline cache can take up to
  // 4)
  const tIcu = value.hasOwnProperty('currentCaseLViewIndex') ? value as TIcu :
                                                               (value as TIcuContainerNode).value;
  ngDevMode && assertTIcu(tIcu);
  return tIcu;
}

/**
 * Store `TIcu` at a give `index`.
 *
 * The `TIcu` can be stored either directly (if it is nested ICU) OR
 * it is stored inside tho `TIcuContainer` if it is top level ICU.
 *
 * The reason for this is that the top level ICU need a `TNode` so that they are part of the render
 * tree, but nested ICU's have no TNode, because we don't know ahead of time if the nested ICU is
 * expressed (parent ICU may have selected a case which does not contain it.)
 *
 * @param tView Current `TView`.
 * @param index Index where the value should be stored at in `Tview.data`
 * @param tIcu The TIcu to store.
 */
export function setTIcu(tView: TView, index: number, tIcu: TIcu): void {
  const tNode = tView.data[index] as null | TIcuContainerNode;
  ngDevMode &&
      assertEqual(
          tNode === null || tNode.hasOwnProperty('tViews'), true,
          'We expect to get \'null\'|\'TIcuContainer\'');
  if (tNode === null) {
    tView.data[index] = tIcu;
  } else {
    ngDevMode && assertTNodeType(tNode, TNodeType.Icu);
    tNode.value = tIcu;
  }
}

/**
 * Set `TNode.insertBeforeIndex` taking the `Array` into account.
 *
 * See `TNode.insertBeforeIndex`
 */
export function setTNodeInsertBeforeIndex(tNode: TNode, index: number) {
  ngDevMode && assertTNode(tNode);
  let insertBeforeIndex = tNode.insertBeforeIndex;
  if (insertBeforeIndex === null) {
    insertBeforeIndex = tNode.insertBeforeIndex =
        [null!/* may be updated to number later */, index];
  } else {
    assertEqual(Array.isArray(insertBeforeIndex), true, 'Expecting array here');
    (insertBeforeIndex as number[]).push(index);
  }
}

/**
 * Create `TNode.type=TNodeType.Placeholder` node.
 *
 * See `TNodeType.Placeholder` for more information.
 */
export function createTNodePlaceholder(
    tView: TView, previousTNodes: TNode[], index: number): TNode {
  const tNode = createTNodeAtIndex(tView, index, TNodeType.Placeholder, null, null);
  addTNodeAndUpdateInsertBeforeIndex(previousTNodes, tNode);
  return tNode;
}
