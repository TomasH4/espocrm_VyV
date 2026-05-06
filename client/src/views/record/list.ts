/************************************************************************
 * This file is part of EspoCRM.
 *
 * EspoCRM – Open Source CRM application.
 * Copyright (C) 2014-2026 EspoCRM, Inc.
 * Website: https://www.espocrm.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 *
 * The interactive user interfaces in modified source and object code versions
 * of this program must display Appropriate Legal Notices, as required under
 * Section 5 of the GNU Affero General Public License version 3.
 *
 * In accordance with Section 7(b) of the GNU Affero General Public License version 3,
 * these Appropriate Legal Notices must retain the display of the "EspoCRM" word.
 ************************************************************************/

import ListBaseRecordView, {ListBaseRecordViewOptions, ListBaseRecordViewSchema} from 'views/record/list-base';

/**
 * Mass-action definitions.
 */
export interface MassActionItem {
    /**
     * A name.
     */
    name?: string;
    /**
     * A group index.
     */
    groupIndex?: number;
    /**
     * A handler.
     */
    handler?: string;
    /**
     * An init function.
     */
    initFunction?: string;
    /**
     * An action function.
     */
    actionFunction?: string;
    /**
     * A config check.
     */
    configCheck?: string;
    /**
     * An ACL scope to check.
     */
    aclScope?: string;
    /**
     * An access action to check.
     */
    acl?: 'create' | 'read' | 'edit' | 'stream' | 'delete' | null;
    /**
     * A URL.
     */
    url?: string;
    /**
     * To skip confirmation.
     */
    bypassConfirmation?: boolean;
    /**
     * A confirmation message.
     */
    confirmationMessage?: string;
    /**
     * A wait message.
     */
    waitMessage?: string;
    /**
     * A success message.
     */
    successMessage?: string;
    /**
     * Is hidden.
     */
    hidden?: boolean;
}

/**
 * A row action.
 */
export interface RowAction {
    /**
     * An action.
     */
    action: string;
    /**
     * A label.
     */
    label?: string;
    /**
     * A link.
     */
    link?: string;
    /**
     * A text.
     */
    text?: string;
    /**
     * Data attributes.
     */
    data?: Record<string, string | number | boolean>;
    /**
     * A group index.
     */
    groupIndex?: number;
}

/**
 * A dropdown item. Handled by a class method `action{Name}` or a handler.
 */
export interface DropdownItem {
    /**
     * A name.
     */
    name: string;
    /**
     * A label. To be translated in a current scope.
     */
    label?: string;
    /**
     * An HTML.
     */
    html?: string;
    /**
     * Hidden.
     */
    hidden?: boolean;
    /**
     * A click handler.
     */
    onClick?: () => void;
}

/**
 * A button. Handled by a class method `action{Name}` or a handler.
 */
export interface Button {
    /**
     * A name.
     */
    name: string;
    /**
     *  A label. To be translated in a current scope.
     */
    label: string;
    /**
     * A style
     */
    style?: 'default' | 'danger' | 'warning' | 'success';
    /**
     * Hidden.
     */
    hidden?: boolean;
    /**
     * A click handler.
     */
    onClick?: () => void;
}

/**
 * Column definitions.
 */
export interface ColumnDefs {
    /**
     * A name (usually a field name).
     */
    name: string;
    /**
     * An overridden field view name.
     */
    view?: string;
    /**
     * A width in percents.
     */
    width?: number;
    /**
     * A width in pixels.
     */
    widthPx?: number;
    /**
     * To use `listLink` mode (link to the detail view).
     */
    link?: boolean;
    /**
     * An alignment.
     */
    align?: 'left' | 'right';
    /**
     * An overridden field type.
     */
    type?: string;
    /**
     * Overridden field parameters.
     */
    params?: Record<string, unknown>;
    /**
     * Field view options.
     */
    options?: Record<string, unknown>;
    /**
     * A label.
     */
    label?: string;
    /**
     * Not sortable.
     */
    notSortable?: boolean;
    /**
     * Hidden by default.
     */
    hidden?: boolean;
    /**
     * No label.
     */
    noLabel?: boolean;
    /**
     * A custom label.
     */
    customLabel?: string;
}

export interface ListRecordViewOptions extends ListBaseRecordViewOptions<ColumnDefs[]> {}

export interface ListRecordViewSchema extends ListBaseRecordViewSchema<ColumnDefs[]> {
    options: ListRecordViewOptions
}

/**
 * A record-list view. Renders and processes list items, actions.
 */
class ListRecordView<
    S extends ListRecordViewSchema = ListRecordViewSchema
> extends ListBaseRecordView<ColumnDefs[], S> {

    protected setup() {
        super.setup();
    }
}

export default ListRecordView;
