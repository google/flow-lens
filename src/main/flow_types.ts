/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview This file contains all of the types defined in
 * https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_visual_workflow.htm
 * NOTE: All of the comments are omitted because the types are generated from
 * the Salesforce documentation.
 */

// tslint:disable:enforce-comments-on-exported-symbols

export enum FlowAssignmentOperator {
  ADD = "Add",
  ADD_AT_START = "AddAtStart",
  ADD_ITEM = "AddItem",
  ASSIGN = "Assign",
  ASSIGN_COUNT = "AssignCount",
  REMOVE_AFTER_FIRST = "RemoveAfterFirst",
  REMOVE_ALL = "RemoveAll",
  REMOVE_BEFORE_FIRST = "RemoveBeforeFirst",
  REMOVE_FIRST = "RemoveFirst",
  REMOVE_POSITION = "RemovePosition",
  REMOVE_UNCOMMON = "RemoveUncommon",
  SUBTRACT = "Subtract",
}

export enum FlowCollectionProcessorType {
  SORT_COLLECTION_PROCESSOR = "SortCollectionProcessor",
  RECOMMENDATION_MAP_COLLECTION_PROCESSOR = "RecommendationMapCollectionProcessor",
  FILTER_COLLECTION_PROCESSOR = "FilterCollectionProcessor",
}

export enum IterationOrder {
  ASC = "Asc",
  DESC = "Desc",
}

export enum FlowEnvironment {
  DEFAULT = "Default",
  SLACK = "Slack",
}

export enum FlowStageStepAssigneeType {
  GROUP = "Group",
  QUEUE = "Queue",
  USER = "User",
}

export enum FlowStageStepActionType {
  STEP_BACKGROUND = "stepBackground",
  STEP_INTERACTIVE = "stepInteractive",
  STEP_MULESOFT = "stepMuleSoft",
}

export enum FlowProcessType {
  ACTION_CADENCE_AUTOLAUNCHED_FLOW = "ActionCadenceAutolaunchedFlow",
  ACTION_CADENCE_STEP_FLOW = "ActionCadenceStepFlow",
  APPOINTMENTS = "Appointments",
  AUTOLAUNCHED_FLOW = "AutoLaunchedFlow",
  CHECKOUT_FLOW = "CheckoutFlow",
  CONTACT_REQUEST_FLOW = "ContactRequestFlow",
  CUSTOMER_LIFECYCLE = "CustomerLifecycle",
  CUSTOM_EVENT = "CustomEvent",
  EVALUATION_FLOW = "EvaluationFlow",
  FIELD_SERVICE_MOBILE = "FieldServiceMobile",
  FIELD_SERVICE_WEB = "FieldServiceWeb",
  FLOW = "Flow",
  FSC_LENDING = "FSCLending",
  INDICATOR_RESULT_FLOW = "IndicatorResultFlow",
  INDIVIDUAL_OBJECT_LINKING_FLOW = "IndividualObjectLinkingFlow",
  INVOCABLE_PROCESS = "InvocableProcess",
  JOURNEY = "Journey",
  LOGIN_FLOW = "LoginFlow",
  LOYALTY_MANAGEMENT_FLOW = "LoyaltyManagementFlow",
  ORCHESTRATOR = "Orchestrator",
  PROMPT_FLOW = "PromptFlow",
  RECOMMENDATION_STRATEGY = "RecommendationStrategy",
  ROUTING_FLOW = "RoutingFlow",
  SURVEY = "Survey",
  SURVEY_ENRICH = "SurveyEnrich",
  WORKFLOW = "Workflow",
  // Reserved values (not to be used)
  ACTION_CADENCE_FLOW = "ActionCadenceFlow",
  ACTION_PLAN = "ActionPlan",
  APP_PROCESS = "AppProcess",
  CART_ASYNC_FLOW = "CartAsyncFlow",
  DIGITAL_FORM = "DigitalForm",
  JOURNEY_BUILDER_INTEGRATION = "JourneyBuilderIntegration",
  MANAGED_CONTENT_FLOW = "ManagedContentFlow",
  ORCHESTRATION_FLOW = "OrchestrationFlow",
  SALES_ENTRY_EXPERIENCE_FLOW = "SalesEntryExperienceFlow",
  TRANSACTION_SECURITY_FLOW = "TransactionSecurityFlow",
  USER_PROVISIONING_FLOW = "UserProvisioningFlow",
}
export enum SortOrder {
  ASC = "Asc",
  DESC = "Desc",
}

export enum FlowRunInMode {
  DEFAULT_MODE = "DefaultMode",
  SYSTEM_MODE_WITH_SHARING = "SystemModeWithSharing",
  SYSTEM_MODE_WITHOUT_SHARING = "SystemModeWithoutSharing",
}
export enum FlowScreenFieldType {
  DISPLAY_TEXT = "DisplayText",
  INPUT_FIELD = "InputField",
  LARGE_TEXT_AREA = "LargeTextArea",
  PASSWORD_FIELD = "PasswordField",
  RADIO_BUTTONS = "RadioButtons",
  DROPDOWN_BOX = "DropdownBox",
  MULTI_SELECT_CHECKBOXES = "MultiSelectCheckboxes",
  MULTI_SELECT_PICKLIST = "MultiSelectPicklist",
  COMPONENT_INSTANCE = "ComponentInstance",
  COMPONENT_CHOICE = "ComponentChoice",
  COMPONENT_INPUT = "ComponentInput",
  REGION = "Region",
  REGION_CONTAINER = "RegionContainer",
  OBJECT_PROVIDED = "ObjectProvided",
}

export enum FlowScreenFieldInputsRevisited {
  USE_STORED_VALUES = "UseStoredValues",
  RESET_VALUES = "ResetValues",
}

export enum FlowRegionContainerType {
  SECTION_WITH_HEADER = "SectionWithHeader",
  SECTION_WITHOUT_HEADER = "SectionWithoutHeader",
}
export enum FlowStartFrequency {
  ONCE = "Once",
  DAILY = "Daily",
  WEEKLY = "Weekly",
  ON_ACTIVATE = "OnActivate",
}

export enum FlowScheduledPathType {
  ASYNC_AFTER_COMMIT = "AsyncAfterCommit",
}

export enum FlowScheduledPathTimeSource {
  RECORD_FIELD = "RecordField",
  RECORD_TRIGGER_EVENT = "RecordTriggerEvent",
}

export enum FlowEntryType {
  AFTER_COMPLETION = "AfterCompletion",
  ALWAYS = "Always",
}

export enum FlowTriggerType {
  CAPABILITY = "Capability",
  DATA_CLOUD_DATA_CHANGE = "DataCloudDataChange",
  EVENT_DRIVEN_JOURNEY = "EventDrivenJourney",
  PLATFORM_EVENT = "PlatformEvent",
  RECORD_AFTER_SAVE = "RecordAfterSave",
  RECORD_BEFORE_DELETE = "RecordBeforeDelete",
  RECORD_BEFORE_SAVE = "RecordBeforeSave",
  SCHEDULED = "Scheduled",
  SCHEDULED_JOURNEY = "ScheduledJourney",
  SEGMENT = "Segment",
}

export enum FlowVersionStatus {
  ACTIVE = "Active",
  DRAFT = "Draft",
  OBSOLETE = "Obsolete",
  INVALID_DRAFT = "InvalidDraft",
}

export enum FlowTransformValueActionType {
  COUNT = "Count",
  INNER_JOIN = "InnerJoin",
  MAP = "Map",
  SUM = "Sum",
}

export enum FlowTransformValueActionInputParameterName {
  AGGREGATION_FIELD = "aggregationField",
  AGGREGATION_VALUES = "aggregationValues",
}

export enum FlowDataType {
  APEX = "Apex",
  BOOLEAN = "Boolean",
  CURRENCY = "Currency",
  DATE = "Date",
  DATE_TIME = "DateTime",
  NUMBER = "Number",
  MULTIPICKLIST = "Multipicklist",
  PICKLIST = "Picklist",
  STRING = "String",
  SOBJECT = "sObject",
}

export enum FlowTransactionModel {
  AUTOMATIC = "Automatic",
  CURRENT_TRANSACTION = "CurrentTransaction",
  NEW_TRANSACTION = "NewTransaction",
}

export enum FormulaDataType {
  APEX = "Apex",
  BOOLEAN = "Boolean",
  CURRENCY = "Currency",
  DATE = "Date",
  DATE_TIME = "DateTime",
  NUMBER = "Number",
  STRING = "String",
  SOBJECT = "sObject",
}

export enum WaitEventType {
  ALARM_EVENT = "AlarmEvent",
  DATE_REF_ALARM_EVENT = "DateRefAlarmEvent",
}

export enum FlowRecordFilterOperator {
  EQUAL_TO = "EqualTo",
  NOT_EQUAL_TO = "NotEqualTo",
  GREATER_THAN = "GreaterThan",
  LESS_THAN = "LessThan",
  GREATER_THAN_OR_EQUAL_TO = "GreaterThanOrEqualTo",
  LESS_THAN_OR_EQUAL_TO = "LessThanOrEqualTo",
  STARTS_WITH = "StartsWith",
  ENDS_WITH = "EndsWith",
  CONTAINS = "Contains",
  IS_NULL = "IsNull",
}

export enum FlowScheduledPathOffsetUnit {
  MONTHS = "Months",
  DAYS = "Days",
  HOURS = "Hours",
  MINUTES = "Minutes",
}

export enum RecordTriggerType {
  CREATE = "Create",
  DELETE = "Delete",
  UPDATE = "Update",
  NONE = "None",
  CREATE_AND_UPDATE = "CreateAndUpdate",
}

export enum FlowWaitConditionType {
  ENTRY_CONDITION = "EntryCondition",
  EXIT_CONDITION = "ExitCondition",
}

export enum FlowComparisonOperator {
  CONTAINS = "Contains",
  ENDS_WITH = "EndsWith",
  EQUAL_TO = "EqualTo",
  GREATER_THAN = "GreaterThan",
  GREATER_THAN_OR_EQUAL_TO = "GreaterThanOrEqualTo",
  IN = "In",
  IS_BLANK = "IsBlank",
  IS_CHANGED = "IsChanged",
  IS_EMPTY = "IsEmpty",
}

export enum DiffStatus {
  ADDED = "Added",
  DELETED = "Deleted",
  MODIFIED = "Modified",
}

export interface FlowDefinition {
  // Flow XML file contains a node with a name of "Flow", not "flow".
  // tslint:disable-next-line:enforce-name-casing
  Flow: Flow;
}

export interface Flow {
  actionCalls?: FlowActionCall[];
  apexPluginCalls?: FlowApexPluginCall[];
  apiVersion?: number;
  assignments?: FlowAssignment[];
  choices?: FlowChoice[];
  collectionProcessors?: FlowCollectionProcessor[];
  constants?: FlowConstant[];
  customErrors?: FlowCustomError[];
  decisions?: FlowDecision[];
  description?: string;
  dynamicChoiceSets?: FlowDynamicChoiceSet[];
  environments?: FlowEnvironment;
  formulas?: FlowFormula[];
  fullName: string;
  interviewLabel?: string;
  isAdditionalPermissionRequiredToRun?: boolean;
  isTemplate?: boolean;
  label: string;
  loops?: FlowLoop[];
  migratedFromWorkflowRuleName?: string;
  orchestratedStages?: FlowOrchestratedStage[];
  processMetadataValues?: FlowMetadataValue[];
  processType?: FlowProcessType;
  recordCreates?: FlowRecordCreate[];
  recordDeletes?: FlowRecordDelete[];
  recordLookups?: FlowRecordLookup[];
  recordRollbacks?: FlowRecordRollback[];
  recordUpdates?: FlowRecordUpdate[];
  runInMode?: FlowRunInMode;
  screens?: FlowScreen[];
  segment?: string;
  stages?: FlowStage[];
  start?: FlowStart;
  startElementReference?: string;
  status?: FlowVersionStatus;
  steps?: FlowStep[];
  subflows?: FlowSubflow[];
  textTemplates?: FlowTextTemplate[];
  timeZoneSidKey?: string;
  transforms?: FlowTransform[];
  triggerOrder?: number;
  variables?: FlowVariable[];
  waits?: FlowWait[];
}

export interface FlowNode extends FlowElement {
  elementSubtype: string;
  label: string;
  locationX: number;
  locationY: number;
  diffStatus?: DiffStatus;
}

export interface FlowElement {
  description: string;
  name: string;
}

export interface FlowApexPluginCall extends FlowNode {
  apexClass: string;
  connector?: FlowConnector;
  faultConnector?: FlowConnector;
  inputParameters?: FlowApexPluginCallInputParameter[];
  outputParameters?: FlowApexPluginCallOutputParameter[];
}

export interface FlowApexPluginCallInputParameter extends FlowBaseElement {
  name: string;
  value: FlowElementReferenceOrValue;
}

export interface FlowApexPluginCallOutputParameter extends FlowBaseElement {
  assignToReference: string;
  name: string;
}

export interface FlowAssignment extends FlowNode {
  assignmentItems: FlowAssignmentItem[];
  connector?: FlowConnector;
}

export interface FlowAssignmentItem extends FlowBaseElement {
  assignToReference: string;
  operator: FlowAssignmentOperator;
  value: FlowElementReferenceOrValue;
}

export interface FlowChoice extends FlowElement {
  choiceText: string;
  dataType: FlowDataType;
  userInput?: FlowChoiceUserInput; // Not supported for choices in multi-select fields
  value?: FlowElementReferenceOrValue;
}

export interface FlowChoiceUserInput extends FlowBaseElement {
  isRequired: boolean;
  promptText: string; // Supports merge fields
  validationRule?: FlowInputValidationRule;
}

export interface FlowCollectionProcessor extends FlowNode {
  assignNextValueToReference?: string;
  collectionProcessorType: FlowCollectionProcessorType;
  collectionReference: string;
  conditionLogic?: string;
  conditions?: FlowCondition[];
  connector?: FlowConnector;
  formula?: string;
  limit?: number; // Available in API version 51.0 and later, nillable
  mapItems?: FlowCollectionMapItem[];
  outputSObjectType?: string;
  sortOptions?: FlowCollectionSortOption[]; // Available in API version 51.0 and later
}

export interface FlowCollectionMapItem {
  assignToFieldReference: string;
  operator: FlowAssignmentOperator;
  value: FlowElementReferenceOrValue;
}

export interface FlowCollectionSortOption {
  doesPutEmptyStringAndNullFirst?: boolean; // Default is false
  sortField?: string; // Required for record collections and Apex-defined variables
  sortOrder: SortOrder;
}

export interface FlowConstant extends FlowElement {
  dataType: FlowDataType;
  value: FlowElementReferenceOrValue;
}

export interface FlowCustomError extends FlowNode {
  description: string;
  connector: FlowConnector;
  customErrorMessages: FlowCustomErrorMessage[];
}

export interface FlowCustomErrorMessage extends FlowElement {
  errorMessage: string;
  fieldSelection?: string;
  isFieldError: boolean;
}

export interface FlowDecision extends FlowNode {
  defaultConnector?: FlowConnector;
  defaultConnectorLabel?: string;
  rules: FlowRule[];
}

export interface FlowRule extends FlowElement {
  conditionLogic: string;
  conditions: FlowCondition[];
  connector?: FlowConnector;
  doesRequireRecordChangedToMeetCriteria?: boolean;
  label: string;
}

export interface FlowDynamicChoiceSet extends FlowElement {
  collectionReference?: string; // Available in API version 54.0 and later
  dataType: FlowDataType;
  displayField?: string; // Required for record choices, not supported for picklist choices
  filters?: FlowRecordFilter[]; // Not supported for picklist choices
  limit?: number; // Maximum and default: 200, Nillable in API version 45.0 and later
  object?: string; // Required for record choices, not supported for picklist choices
  outputAssignments?: FlowOutputFieldAssignment[]; // Not supported for picklist choices
  picklistField?: string; // Required for picklist choices, not supported for record choices. Available in API version 35.0 and later.
  picklistObject?: string; // Required for picklist choices, not supported for record choices. Available in API version 35.0 and later.
  sortField?: string; // Not supported for picklist choices
  sortOrder?: SortOrder; // Not supported for picklist choices
  valueField?: string; // Not supported for picklist choices
}

export interface FlowFormula extends FlowElement {
  dataType: FlowDataType;
  expression: string;
  scale?: number; // Only available when dataType is Number or Currency
}

export interface FlowLoop extends FlowNode {
  assignNextValueToReference?: string;
  collectionReference: string;
  iterationOrder?: IterationOrder;
  nextValueConnector?: FlowConnector;
  noMoreValuesConnector?: FlowConnector;
}

export interface FlowOrchestratedStage extends FlowNode {
  connector?: FlowConnector;
  exitActionInputParameters?: FlowStageStepExitActionInputParameter[];
  exitActionName?: string;
  exitActionOutputParameters?: FlowStageStepExitActionOutputParameter[];
  exitActionType?: string;
  exitConditionLogic?: string;
  exitConditions?: FlowCondition[];
  faultConnector?: never; // Not used in this subtype
  runAsUser?: boolean; // default: false
  stageSteps: FlowStageStep[];
}

export interface FlowStageStep {
  actionName: string;
  actionType: FlowStageStepActionType;
  assignees?: FlowStageStepAssignee[]; // Array as multiple assignees are possible
  entryActionInputParameters?: FlowStageStepEntryActionInputParameter[];
  entryActionName?: string;
  entryActionOutputParameters?: FlowStageStepEntryActionOutputParameter[];
  entryActionType?: string;
  entryConditionLogic?: string;
  entryConditions?: FlowCondition[];
  exitActionInputParameters?: FlowStageStepExitActionInputParameter[];
  exitActionName?: string;
  exitActionOutputParameters?: FlowStageStepExitActionOutputParameter[];
  exitActionType?: string;
  exitConditionLogic?: string;
  exitConditions?: FlowCondition[];
  inputParameters?: FlowStageStepInputParameter[];
  label: string;
  outputParameters?: FlowStageStepOutputParameter[];
  requiresAsyncProcessing?: boolean;
  stepSubtype?: string; // Reserved for internal use.
}

export interface FlowStageStepAssignee {
  assignee: FlowElementReferenceOrValue;
  assigneeType: FlowStageStepAssigneeType;
}

export interface FlowStageStepEntryActionInputParameter
  extends FlowBaseElement {
  name: string;
  value: FlowElementReferenceOrValue;
}

export interface FlowStageStepEntryActionOutputParameter
  extends FlowBaseElement {
  assignToReference?: string; // Reserved for future use
  name: "isOrchestrationConditionMet";
}

export interface FlowStageStepExitActionInputParameter extends FlowBaseElement {
  name: string;
  value: FlowElementReferenceOrValue;
}

export interface FlowStageStepExitActionOutputParameter
  extends FlowBaseElement {
  assignToReference?: string; // Reserved for future use
  name: "isOrchestrationConditionMet"; // Only possible value
}

export interface FlowStageStepInputParameter extends FlowBaseElement {
  name: string;
  value: FlowElementReferenceOrValue;
}

export interface FlowStageStepOutputParameter extends FlowBaseElement {
  assignToReference?: string; // Reserved for future use.
  name: string;
}

export interface FlowRecordCreate extends FlowNode {
  assignRecordIdToReference?: string;
  connector?: FlowConnector;
  faultConnector?: FlowConnector;
  inputAssignments: FlowInputFieldAssignment[];
  inputReference: string;
  object: string;
  storeOutputAutomatically?: boolean; // default: false, Available in API version 48.0 and later
}

export interface FlowRecordDelete extends FlowNode {
  connector?: FlowConnector;
  faultConnector?: FlowConnector;
  filters?: FlowRecordFilter[];
  inputReference: string;
  object: string;
}

export interface FlowRecordLookup extends FlowNode {
  assignNullValuesIfNoRecordsFound?: boolean; // Supported only when storeOutputAutomatically is false
  connector?: FlowConnector;
  faultConnector?: FlowConnector;
  filterLogic?: string; // Available in API version 50.0 and later
  filters: FlowRecordFilter[];
  getFirstRecordOnly?: boolean; // Supported only when storeOutputAutomatically is true, Available in API version 47.0 and later
  limit?: number; // Available in API version 30.0 and later
  object: string;
  outputAssignments?: FlowOutputFieldAssignment[]; // Supported only when storeOutputAutomatically is false
  outputReference?: string; // Supported only when storeOutputAutomatically is false
  queriedFields: string[];
  sortField?: string; // Available in API version 25.0 and later
  sortOrder?: SortOrder; // Available in API version 25.0 and later
  storeOutputAutomatically?: boolean; // Supported only when processType is Flow or AutoLaunchedFlow, Available in API version 47.0 and later
}

export interface FlowOutputFieldAssignment extends FlowBaseElement {
  assignToReference: string;
  field: string;
}

export interface FlowRecordRollback extends FlowNode {
  connector: FlowConnector; // Specifies which node to execute after the rollback.
}

export interface FlowRecordUpdate extends FlowNode {
  connector?: FlowConnector;
  faultConnector?: FlowConnector;
  filters: FlowRecordFilter[];
  inputAssignments: FlowInputFieldAssignment[]; // Assuming FlowInputFieldAssignment is a pre-existing interface
  inputReference: string;
  object: string;
}

export interface FlowInputFieldAssignment extends FlowBaseElement {
  field: string; // The name of the field to assign a value to.
  value: FlowElementReferenceOrValue;
}

export interface FlowScreen extends FlowNode {
  allowBack?: boolean; // Default is true
  allowFinish?: boolean; // Default is true
  allowPause?: boolean; // Default is true (available in API version 33.0 and later)
  backButtonLabel?: string;
  connector?: FlowConnector;
  fields: FlowScreenField[];
  helpText?: string; // Supports merge fields in API version 26.0 and later
  nextOrFinishButtonLabel?: string;
  pauseButtonLabel?: string;
  pausedText?: string; // Available in API version 33.0 and later
  rules?: unknown; // Reserved for future use
  showFooter?: boolean; // Default is true (available in API version 42.0 and later)
  showHeader?: boolean; // Default is true (available in API version 42.0 and later)
}

export interface FlowScreenField extends FlowElement {
  choiceReferences?: string[]; // Array of references to FlowChoices or FlowDynamicChoiceSets
  dataType?: FlowDataType;
  dataTypeMappings?: FlowDataTypeMapping[]; // Reserved for future use
  defaultSelectedChoiceReference?: string;
  defaultValue?: FlowElementReferenceOrValue;
  extensionName?: string; // Available in API version 42.0 and later
  fields?: FlowScreenField[]; // Available in API version 49.0 and later
  fieldText: string;
  fieldType: FlowScreenFieldType;
  helpText?: string;
  inputParameters?: FlowScreenFieldInputParameter[]; // Supported only when fieldType is ComponentInstance
  inputsOnNextNavToAssocScrn?: FlowScreenFieldInputsRevisited;
  isRequired?: boolean;
  isVisible?: boolean; // Reserved for future use
  objectFieldReference?: string;
  outputParameters?: FlowScreenFieldOutputParameter[]; // Supported only when fieldType is ComponentInstance and storeOutputAutomatically is false.
  regionContainerType?: FlowRegionContainerType; // Available only when the component type is Section. Available in API version 55.0 and later.
  scale?: number;
  storeOutputAutomatically?: boolean;
  validationRule?: FlowInputValidationRule;
  visibilityRule?: FlowVisibilityRule;
}

export interface FlowScreenFieldOutputParameter extends FlowBaseElement {
  assignToReference: string;
  name: string;
}

export interface FlowInputValidationRule {
  errorMessage: string;
  formulaExpression: string;
}

export interface FlowVisibilityRule {
  conditionLogic: string;
  conditions: FlowCondition[];
}

export interface FlowScreenFieldInputParameter {
  name: string;
  value: FlowElementReferenceOrValue;
}

export interface FlowStage extends FlowElement {
  isActive: boolean;
  label: string;
  stageOrder: number;
}

export interface FlowStart extends FlowNode {
  capabilityTypes?: FlowCapability[]; // In API version 60.0 and later, only one capability is supported.
  connector: FlowConnector;
  doesRequireRecordChangedToMeetCriteria?: boolean;
  entryType?: FlowEntryType;
  filterFormula?: string;
  filterLogic?: string;
  filters?: FlowRecordFilter[];
  flowRunAsUser?: string;
  form?: string; // Required only for form-triggered flows. Available in API version 59.0 and later.
  object?: string;
  publishSegment?: boolean;
  recordTriggerType?: RecordTriggerType;
  schedule?: FlowSchedule; // Required when triggerType is Scheduled.
  scheduledPaths?: FlowScheduledPath[];
  segment?: string; // Available in API version 56.0 and later.
  timeZoneSidKey?: string; // Reserved for future use.
  triggerType?: FlowTriggerType;
}

export interface FlowCapability extends FlowElement {
  capabilityName: string;
  inputs: FlowCapabilityInput[];
}

export interface FlowCapabilityInput extends FlowElement {
  capabilityInputName: string;
  dataType: "sObject"; // Only valid type is sObject for now
  isCollection: boolean;
}

export interface FlowSchedule {
  frequency: FlowStartFrequency;
  startDate: string; // Assuming date is represented as a string
  startTime: string; // Assuming time is represented as a string
}

export interface FlowScheduledPath extends FlowElement {
  connector: FlowConnector;
  label: string;
  maxBatchSize?: number; // Default is 200
  offsetNumber: number; // Can be positive or negative
  offsetUnit: FlowScheduledPathOffsetUnit;
  pathType?: FlowScheduledPathType; // Default is null
  recordField?: string; // Required if timeSource is RecordField
  timeSource: FlowScheduledPathTimeSource;
}

export interface FlowStep extends FlowNode {
  connectors: FlowConnector[];
}

export interface FlowSubflow extends FlowNode {
  connector?: FlowConnector;
  flowName: string;
  inputAssignments: FlowSubflowInputAssignment[];
  outputAssignments: FlowSubflowOutputAssignment[];
  storeOutputAutomatically?: boolean;
}

export interface FlowSubflowInputAssignment extends FlowBaseElement {
  name: string;
  value: FlowElementReferenceOrValue;
}

export interface FlowSubflowOutputAssignment extends FlowBaseElement {
  assignToReference: string;
  name: string;
}

export interface FlowTextTemplate extends FlowElement {
  isViewedAsPlainText?: boolean;
  text: string;
}

export interface FlowTransform extends FlowNode {
  apexClass?: string;
  connector?: FlowConnector[]; // Array because multiple connectors might be possible
  dataType: FlowDataType;
  isCollection?: boolean; // default: false
  objectType?: string;
  scale?: number;
  transformValues: FlowTransformValue[];
}

export interface FlowTransformValue extends FlowBaseElement {
  transformValueActions: FlowTransformValueAction[];
  transformValueName?: string; // Reserved for future use.
  transformValueLabel?: string; // Reserved for future use.
  transformValueDescription?: string; // Reserved for future use.
}

export interface FlowTransformValueAction extends FlowBaseElement {
  inputParameters?: FlowTransformValueActionInputParameter[]; // Optional in API version 59.0, required in API version 60.0 and later
  outputFieldApiName: string;
  transformType: FlowTransformValueActionType;
  value: FlowElementReferenceOrValue;
}

export interface FlowTransformValueActionInputParameter {
  name: FlowTransformValueActionInputParameterName;
  value: FlowElementReferenceOrValue;
}

export interface FlowVariable extends FlowElement {
  apexClass?: string;
  dataType: FlowDataType;
  isCollection?: boolean;
  isInput?: boolean;
  isOutput?: boolean;
  objectType?: string;
  scale?: number;
  value?: FlowElementReferenceOrValue;
}

export interface FlowActionCall extends FlowNode {
  actionName: string;
  actionType: string;
  connector?: FlowConnector;
  dataTypeMappings?: FlowDataTypeMapping[];
  faultConnector?: FlowConnector;
  flowTransactionModel?: FlowTransactionModel;
  inputParameters?: FlowActionCallInputParameter[];
  nameSegment?: string;
  outputParameters?: FlowActionCallOutputParameter[];
  storeOutputAutomatically?: boolean; // default: false
  versionSegment?: number; // default: 1
}

export interface FlowConnector {
  isGoTo: boolean;
  targetReference: string;
}

export interface FlowDataTypeMapping {
  typeName: string;
  typeValue: string;
}

export interface FlowActionCallInputParameter {
  name: string;
  value: FlowElementReferenceOrValue;
}

export interface FlowActionCallOutputParameter {
  assignToReference: string;
  name: string;
}

export interface FlowElementReferenceOrValue {
  apexValue?: string;
  booleanValue?: boolean;
  dateTimeValue?: string; // Assuming dateTime is represented as a string
  dateValue?: string; // Assuming date is represented as a string
  elementReference?: string;
  formulaDataType?: FormulaDataType;
  formulaExpression?: string;
  numberValue?: number; // using number to represent double
  setupReference?: string;
  setupReferenceType?: string;
  sobjectValue?: string;
  stringValue?: string;
  transformValueReference?: string;
}

export interface FlowWait extends FlowNode {
  defaultConnector?: FlowConnector;
  defaultConnectorLabel?: string;
  faultConnector?: FlowConnector;
  timeZoneId?: string; // Reserved for future use.
  waitEvents: FlowWaitEvent[];
}

export interface FlowWaitEvent extends FlowElement {
  conditionLogic?: string;
  associatedElement?: string;
  conditions: FlowCondition[];
  connector?: FlowConnector;
  eventType: WaitEventType;
  extendUntil?: string; // Assuming Time is represented as a string
  filters?: FlowRecordFilter[];
  filterLogic?: string;
  inputParameters: FlowWaitEventInputParameter[];
  label: string;
  object?: string;
  offset?: number;
  offsetUnit?: FlowScheduledPathOffsetUnit;
  outputParameters: FlowWaitEventOutputParameter[];
  recordTriggerType?: RecordTriggerType;
}

export interface FlowRecordFilter {
  field: string;
  operator: FlowRecordFilterOperator;
  value: FlowElementReferenceOrValue;
}

export interface FlowWaitEventInputParameter {
  name: string;
  value: FlowElementReferenceOrValue;
}

export interface FlowWaitEventOutputParameter {
  assignToReference: string;
  name: string;
}

export interface FlowBaseElement {
  processMetadataValues: FlowMetadataValue[];
}

export interface FlowMetadataValue {
  name: string;
  value: FlowElementReferenceOrValue;
}

export interface FlowCondition extends FlowBaseElement {
  conditionType?: FlowWaitConditionType;
  leftValueReference: string;
  operator: FlowComparisonOperator;
  rightValue: FlowElementReferenceOrValue;
}
