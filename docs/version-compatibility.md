# Version Compatibility

This document tracks the compatibility between different versions of n8n and Make.com, highlighting which features are supported by the n8n-Make converter.

## Supported Platform Versions

| Platform | Supported Versions | Latest Tested |
|----------|-------------------|---------------|
| n8n      | v0.170.0 and later | v0.214.3     |
| Make.com  | API v3 and later   | June 2023 API |

## Feature Compatibility Matrix

### Node Types Compatibility

| n8n Node Type | Make Module Type | Support Level | Limitations |
|---------------|-----------------|--------------|-------------|
| HTTP Request  | HTTP            | Full         | None        |
| Function      | Code            | Partial      | Complex JS transformations may require manual review |
| Set           | Set Variable    | Full         | None        |
| Filter        | Filter          | Full         | None        |
| IF            | Router          | Full         | None        |
| Merge         | Aggregator      | Full         | None        |
| MongoDB       | MongoDB         | Full         | Some advanced options may require adjustment |
| Manual Trigger | Scheduler      | Partial      | Make.com lacks direct equivalent, uses scheduler as placeholder |
| Webhook       | Webhook         | Full         | Authentication differences require review |
| Email         | Email           | Partial      | Attachment handling differs |
| FTP           | FTP             | Full         | None        |
| Google Sheets | Google Sheets   | Partial      | Some advanced operations differ |
| Slack         | Slack           | Partial      | Some message formatting differs |
| REST API      | REST            | Full         | None        |
| Telegram      | Telegram        | Partial      | Some message types handled differently |
| CSV           | CSV             | Full         | None        |
| JSON          | JSON            | Full         | None        |
| Cron          | Scheduler       | Full         | None        |
| Wait          | Timer           | Full         | None        |
| Execute Workflow | Flow Control | Partial      | Implementation differences require manual review |
| AMQP          | AMQP            | Minimal      | Significant differences, needs manual review |
| AWS S3        | AWS S3          | Partial      | Some advanced operations differ |
| MySQL         | MySQL           | Full         | None        |
| Postgres      | Postgres        | Full         | None        |
| IMAP          | Email           | Partial      | Feature parity differences |
| SMTP          | Email           | Partial      | Feature parity differences |
| Airtable      | Airtable        | Full         | None        |
| GitHub        | GitHub          | Partial      | Some API differences |
| GitLab        | GitLab          | Partial      | Some API differences |
| Google Drive  | Google Drive    | Partial      | Some API differences |

### Expression Handling Compatibility

| Expression Feature | n8n Syntax | Make.com Syntax | Support Level | Notes |
|-------------------|------------|----------------|--------------|-------|
| Variable References | `$json.field` | `1.field` | Full | Automatic conversion between formats |
| Node References | `$node["NodeName"].field` | `NodeName.field` | Full | Converted correctly |
| Environment Variables | `$env.VARIABLE` | `env.VARIABLE` | Full | Preserved during conversion |
| JSON Path | `$json.items[0].id` | `1.items[0].id` | Full | Array indexing preserved |
| String Operations | `$str.upper($json.name)` | `upper(1.name)` | Full | Function calls adapted |
| Numeric Operations | `$json.count * 2` | `1.count * 2` | Full | Arithmetic preserved |
| Conditional Logic | `$json.age > 18 ? "Adult" : "Minor"` | `ifThenElse(1.age > 18, "Adult", "Minor")` | Full | Ternary expressions converted |
| Date Formatting | `$date.format($json.date, "YYYY-MM-DD")` | `formatDate(1.date, "YYYY-MM-DD")` | Full | Date functions mapped |
| Array Functions | `$array.length($json.items)` | `length(1.items)` | Full | Array functions mapped |
| Complex Objects | `{ "name": $json.name, "id": $json.id }` | `{ "name": 1.name, "id": 1.id }` | Full | Object structures preserved |
| Embedded Expressions | `Hello, {{ $json.name }}!` | `Hello, {{1.name}}!` | Full | Embedded expressions converted |
| Regex | `$str.matches($json.text, "pattern")` | `matches(1.text, "pattern")` | Full | Regex functions mapped |
| Multiple References | `$json.first + " " + $json.last` | `1.first + " " + 1.last` | Full | Multiple references preserved |
| Function Chaining | `$str.upper($str.trim($json.name))` | `upper(trim(1.name))` | Full | Function chaining preserved |
| JS Expressions | Full JS in Function node | Limited JS in Code module | Partial | Complex logic may need manual review |

### Workflow Features Compatibility

| Feature | n8n | Make.com | Support Level | Notes |
|---------|-----|---------|--------------|-------|
| Workflow Structure | Nodes + Connections | Modules + Routes | Full | Converted bidirectionally |
| Error Handling | `continueOnFail` | Error routes | Partial | Implementation differences |
| Pinned Data | Testing data saved with workflow | Bundle data | Not Supported | Not converted, platform specific |
| Credentials | Encrypted in workflow | Connection references | Partial | References preserved, but credentials need manual setup |
| Workflow Variables | Global variables | No direct equivalent | Partial | Converted to variables module |
| Executions | Execution history | Execution history | Not Applicable | Platform-specific, not part of conversion |
| Scheduled Triggers | Cron node | Scheduler module | Full | Schedule patterns converted |
| Webhook Security | Various auth methods | Various auth methods | Partial | Some security features differ |
| Subworkflows | Execute Workflow node | Scenario references | Partial | References preserved, but may need adjustment |
| Rate Limiting | Throttle node | Flow Control | Full | Limits converted |
| Retry Logic | Node retry settings | Module retry settings | Full | Retry settings preserved |
| Pagination | Built into nodes | Iterator/Aggregator pattern | Partial | Some manual configuration needed |

## n8n Feature Support Status

| Feature Category | Support Level | Notes |
|-----------------|--------------|-------|
| Core Nodes | 90% | Most common nodes fully supported |
| Community Nodes | 30% | Limited support for community nodes |
| Expressions | 95% | Most expressions convert correctly |
| Workflow Structure | 100% | Full conversion of workflow structure |
| Credentials | 50% | References preserved but need manual setup |
| UI Settings | 10% | Minimal UI setting conversion |
| Custom JS Code | 70% | Basic code conversion, complex code needs review |
| Binary Data | 80% | Most binary data handling converted |
| Execution Control | 90% | Most execution flow controls converted |
| Webhooks | 85% | Most webhook functionality converted |
| Triggers | 80% | Most trigger types supported |

## Make.com Feature Support Status

| Feature Category | Support Level | Notes |
|-----------------|--------------|-------|
| Core Modules | 90% | Most common modules fully supported |
| App Integrations | 60% | Popular integrations supported |
| Expressions | 95% | Most expressions convert correctly |
| Workflow Structure | 100% | Full conversion of workflow structure |
| Connections | 50% | References preserved but need manual setup |
| UI Settings | 10% | Minimal UI setting conversion |
| Custom JS | 70% | Basic code conversion, complex code needs review |
| Data Structures | 80% | Most data structures converted correctly |
| Execution Control | 90% | Most execution flow controls converted |
| Webhooks | 85% | Most webhook functionality converted |
| Triggers | 80% | Most trigger types supported |
| Iterators | 90% | Iterator pattern fully supported |

## Known Limitations

1. **Complex JavaScript Code**: Custom functions with complex JavaScript might need manual review and adjustment after conversion.

2. **Platform-Specific Features**: Some features that are specific to one platform (like n8n's pinned data or Make.com's bundle inspector) have no direct equivalent and are not converted.

3. **Authentication & Credentials**: While credential references are preserved during conversion, actual credentials need to be set up manually in the target platform due to security constraints.

4. **Custom Nodes/Modules**: Custom or community-created nodes/modules may not have mappings and will require manual configuration.

5. **UI Settings**: Most UI-specific settings (like node positions, colors, or notes) are not fully preserved during conversion.

6. **Binary Data Handling**: There are differences in how the platforms handle binary data (files, images, etc.) which may require additional configuration.

7. **Error Handling**: Error handling mechanisms differ between platforms and may require adjustment for equivalent functionality.

8. **Rate Limiting**: Different rate limiting and throttling mechanisms may affect workflow execution performance.

## Versioning Policy

The converter aims to support the latest stable versions of both n8n and Make.com. As new versions are released with breaking changes, the converter will be updated accordingly. Major version updates will be documented here with specific compatibilities.

- **Major Version Updates**: Significant changes to node/module structure or expression syntax
- **Minor Version Updates**: New features or nodes/modules added
- **Patch Updates**: Bug fixes and performance improvements

## Reporting Compatibility Issues

If you encounter compatibility issues not listed in this document, please:

1. Check that you're using supported versions of both platforms
2. Create an issue in our GitHub repository with:
   - The specific node types/modules involved
   - The version of n8n and/or Make.com
   - A minimal example workflow showing the issue
   - Expected vs. actual behavior

## Future Compatibility Plans

The converter is continuously updated to improve compatibility between the platforms. Upcoming improvements include:

- Support for more community nodes
- Enhanced error handling conversion
- Improved binary data handling
- Support for more complex JavaScript transformations
- Better credential management
- Addition of missing node type mappings 