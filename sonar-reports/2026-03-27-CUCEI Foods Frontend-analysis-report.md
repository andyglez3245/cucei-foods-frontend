# Code analysis
## CUCEI Foods Frontend 
#### Branch main
#### Version 1.0.0 

**By: Administrator**

*Date: 2026-03-27*

*Analyzed the: 2026-03-26*

## Introduction
This document contains results of the code analysis of CUCEI Foods Frontend



## Configuration

- Quality Profiles
    - Names: Sonar way [CSS]; Sonar way [JavaScript]; 
    - Files: d7e0284f-e3c2-4bf7-ae7e-4478b86be570.json; fe555357-7877-4fd7-82c9-8ce171f9eb17.json; 


 - Quality Gate
    - Name: Sonar way
    - File: Sonar way.xml

## Synthesis

### Analysis Status

Reliability | Security | Security Review | Maintainability |
:---:|:---:|:---:|:---:
A | A | A | A |

### Quality gate status

| Quality Gate Status | ERROR |
|-|-|

Metric|Value
---|---
Coverage on New Code|OK
Duplicated Lines (%) on New Code|ERROR (3.2% is greater than 3%)
New Issues|OK


### Metrics

Coverage | Duplications | Comment density | Median number of lines of code per file | Adherence to coding standard |
:---:|:---:|:---:|:---:|:---:
85.6 % | 7.5 % | 27.4 % | 54.0 | 99.8 %

### Tests

Total | Success Rate | Skipped | Errors | Failures |
:---:|:---:|:---:|:---:|:---:
0 | 0 % | 0 | 0 | 0

### Detailed technical debt

Reliability|Security|Maintainability|Total
---|---|---|---
-|-|0d 2h 48min|0d 2h 48min


### Metrics Range

\ | Cyclomatic Complexity | Cognitive Complexity | Lines of code per file | Coverage | Comment density (%) | Duplication (%)
:---|:---:|:---:|:---:|:---:|:---:|:---:
Min | 1.0 | 0.0 | 2.0 | 28.6 | 0.0 | 0.0
Max | 156.0 | 89.0 | 872.0 | 100.0 | 50.0 | 68.5

### Volume

Language|Number
---|---
CSS|214
JavaScript|790
Total|1004


## Issues

### Issues count by severity and types

Type / Severity|INFO|MINOR|MAJOR|CRITICAL|BLOCKER
---|---|---|---|---|---
BUG|0|0|0|0|0
VULNERABILITY|0|0|0|0|0
CODE_SMELL|1|11|5|1|0


### Issues List

Name|Description|Type|Severity|Number
---|---|---|---|---
Constructors should not contain asynchronous operations||CODE_SMELL|CRITICAL|1
Track uses of "TODO" tags||CODE_SMELL|INFO|1
Text and background colors should have sufficient contrast||CODE_SMELL|MAJOR|2
Sections of code should not be commented out||CODE_SMELL|MAJOR|1
Optional chaining should be preferred||CODE_SMELL|MAJOR|2
Exceptions should not be ignored||CODE_SMELL|MINOR|2
Use "globalThis" instead of "window", "self", or "global"||CODE_SMELL|MINOR|3
Number static methods and properties should be preferred over global equivalents||CODE_SMELL|MINOR|6


## Security Hotspots

### Security hotspots count by category and priority

Category / Priority|LOW|MEDIUM|HIGH
---|---|---|---
LDAP Injection|0|0|0
Object Injection|0|0|0
Server-Side Request Forgery (SSRF)|0|0|0
XML External Entity (XXE)|0|0|0
Insecure Configuration|0|0|0
XPath Injection|0|0|0
Authentication|0|0|0
Weak Cryptography|0|0|0
Denial of Service (DoS)|0|0|0
Log Injection|0|0|0
Cross-Site Request Forgery (CSRF)|0|0|0
Open Redirect|0|0|0
Permission|0|0|0
SQL Injection|0|0|0
Encryption of Sensitive Data|0|0|0
Traceability|0|0|0
Buffer Overflow|0|0|0
File Manipulation|0|0|0
Code Injection (RCE)|0|0|0
Cross-Site Scripting (XSS)|0|0|0
Command Injection|0|0|0
Path Traversal Injection|0|0|0
HTTP Response Splitting|0|0|0
Others|0|0|0


### Security hotspots


