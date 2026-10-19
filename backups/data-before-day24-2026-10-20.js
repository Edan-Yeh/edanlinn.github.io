window.CLOUD_SA_DATA = {
  "updatedAt": "2026-10-16",
  "completedDays": 23,
  "currentTrack": "Cloud × AI Solutions Architect / AI Tutor Reliability",
  "scores": [
    {
      "day": 1,
      "score": 72
    },
    {
      "day": 2,
      "score": 84
    },
    {
      "day": 3,
      "score": 88
    },
    {
      "day": 4,
      "score": 87
    },
    {
      "day": 5,
      "score": 81
    },
    {
      "day": 6,
      "score": 83
    },
    {
      "day": 7,
      "score": 86
    },
    {
      "day": 8,
      "score": 94
    },
    {
      "day": 9,
      "score": 92
    },
    {
      "day": 10,
      "score": 91
    },
    {
      "day": 11,
      "score": 86
    },
    {
      "day": 12,
      "score": 88
    },
    {
      "day": 13,
      "score": 82
    },
    {
      "day": 14,
      "score": 78
    },
    {
      "day": 15,
      "score": 98
    },
    {
      "day": 16,
      "score": 98
    },
    {
      "day": 19,
      "score": 90
    },
    {
      "day": 17,
      "score": 100
    },
    {
      "day": 18,
      "score": 90
    },
    {
      "day": 20,
      "score": 65
    },
    {
      "day": 21,
      "score": 90
    },
    {
      "day": 22,
      "score": 78
    },
    {
      "day": 23,
      "score": 58
    }
  ],
  "roadmap": [
    "Architecture",
    "Networking",
    "IAM / Security",
    "Compute",
    "Storage",
    "Database",
    "High Availability",
    "DR",
    "Migration",
    "Modernization",
    "Terraform",
    "Docker",
    "Kubernetes",
    "CI/CD",
    "Observability",
    "FinOps",
    "GenAI / Bedrock",
    "GCP 對照"
  ],
  "skillMap": {
    "summary": [
      {
        "label": "完成訓練",
        "value": "Day 1–23"
      },
      {
        "label": "目前主題",
        "value": "Cloud × AI / AI Tutor Reliability"
      },
      {
        "label": "已建立基礎",
        "value": "DR + Migration + Container Platform Selection"
      },
      {
        "label": "下一階段",
        "value": "Modernization / Containers"
      }
    ],
    "domains": [
      {
        "name": "Architecture",
        "status": "stable",
        "statusLabel": "基礎已建立",
        "items": [
          "Requirement / Constraint / Trade-off",
          "Failure Mode 思考",
          "High Availability 基本概念",
          "RTO / RPO 基礎判斷",
          "Multi-AZ vs Multi-Region",
          "Security / Reliability / Cost 平衡"
        ]
      },
      {
        "name": "Networking",
        "status": "stable",
        "statusLabel": "掌握度穩定",
        "items": [
          "VPC",
          "Public / Private Subnet",
          "Internet Gateway",
          "NAT Gateway",
          "Security Group",
          "NACL",
          "ALB / WAF 基本角色",
          "Private App / DB Network Pattern"
        ]
      },
      {
        "name": "IAM / Security",
        "status": "strengthen",
        "statusLabel": "持續強化",
        "items": [
          "IAM User / Role / Policy",
          "Temporary Credentials",
          "Least Privilege",
          "sts:AssumeRole",
          "Trust Policy",
          "Permission Policy",
          "Explicit Deny",
          "AWS Organizations / SCP 基礎",
          "CloudTrail Audit"
        ]
      },
      {
        "name": "Compute",
        "status": "stable",
        "statusLabel": "掌握度穩定",
        "items": [
          "EC2",
          "Application Load Balancer",
          "Auto Scaling Group",
          "Launch Template",
          "Replacement vs Scale Out",
          "Min / Desired / Max Capacity",
          "CPUUtilization",
          "RequestCountPerTarget",
          "Instance Warm-up",
          "Scheduled Scaling"
        ]
      },
      {
        "name": "Storage / S3",
        "status": "current",
        "statusLabel": "目前學習中",
        "items": [
          "S3 Object Storage",
          "Bucket / Object / Key",
          "Versioning",
          "Lifecycle Policy",
          "S3 Standard",
          "Standard-IA",
          "Glacier 基礎",
          "SSE-KMS",
          "S3 IAM Object ARN",
          "CloudTrail S3 Data Events",
          "Object Lock / WORM",
          "Compliance vs Governance",
          "Cross-Region Replication",
          "RTO / RPO 基礎",
          "S3 RTC 與 SLA 思維"
        ]
      },
      {
        "name": "Architecture / DR",
        "status": "current",
        "statusLabel": "目前學習中",
        "items": [
          "Backup & Restore",
          "Pilot Light",
          "Warm Standby",
          "Multi-Region Active/Active",
          "RTO / RPO / Cost Trade-off",
          "Recovery Dependency Chain",
          "Route 53 / Cross-Region Traffic Failover",
          "Aurora Global Database",
          "Split-brain / Write Fencing",
          "DR Test / Runbook"
        ]
      },
      {
        "name": "下一階段",
        "status": "next",
        "statusLabel": "接下來",
        "items": [
          "Modernization",
          "Containers / ECS / EKS",
          "Terraform",
          "CI/CD"
        ]
      },
      {
        "name": "Migration / 7 Rs",
        "status": "current",
        "statusLabel": "目前學習中",
        "items": [
          "Rehost",
          "Replatform",
          "Refactor / Re-architect",
          "Repurchase",
          "Retain",
          "Retire",
          "Relocate",
          "AWS Transform MGN",
          "AWS DMS Full Load + CDC",
          "Cutover / CDC Lag / Validation"
        ]
      }
    ],
    "mastered": [
      "IGW / NAT Gateway",
      "Public / Private Subnet",
      "SG vs NACL",
      "ALB / ASG / Launch Template",
      "Replacement vs Scaling",
      "Instance Warm-up",
      "S3 Versioning",
      "S3 Lifecycle",
      "Least Privilege 基本思維",
      "RTO vs RPO",
      "S3 Object Lock Compliance",
      "S3 CRR 非同步複寫",
      "Multi-AZ = HA",
      "Read Replica = Read Scaling",
      "PITR = Logical Data Recovery",
      "Aurora Writer vs Reader Endpoint",
      "Aurora Shared Cluster Storage",
      "Aurora Replica = Read Scaling + Failover Target",
      "Aurora Global Database = Multi-Region DR",
      "PITR = Logical / Human Error Recovery",
      "Manual Snapshot = Pre-change Recovery Point",
      "Aurora Global Database = Lower-RTO Region DR",
      "Backup & Restore = Lowest cost / Longer RTO",
      "Warm Standby = Fully functional but scaled down",
      "Warm Standby lower cost than Active/Active",
      "DR Dependency Chain beyond Database",
      "Rehost = Move with minimal architecture change",
      "Replatform = Move + limited platform optimization",
      "Refactor = Architecture / code redesign",
      "DMS Full Load + CDC for low-downtime DB migration",
      "Cutover = Stop/control writes → Catch up → Validate → Switch → Smoke Test → Open Traffic"
    ],
    "confused": [
      "Trust Policy vs Permission Policy",
      "SCP vs IAM Permission",
      "Authentication vs Authorization",
      "ALB Health Check vs ASG Replacement",
      "S3 ARN vs s3:// URI",
      "CloudTrail vs S3 Data Events",
      "Versioning vs Backup",
      "S3 RTC 15 分鐘 SLA vs Business RPO 10 分鐘",
      "Replication vs 完整 Backup",
      "Multi-AZ Failover vs PITR",
      "Reporting Read Path 不應畫成 Primary → Replica Request Hop",
      "Multi-AZ HA vs Region-level DR",
      "Primary Region vs Writer DB Instance",
      "Business RPO vs Cross-Region Replication Lag",
      "RTO = Restore Service in DR Region, not Failback to Original Region",
      "Cross-Region Backup vs Aurora Global Database",
      "RPO Requirement vs Replication Lag Evidence",
      "Pilot Light vs Warm Standby",
      "Active/Active Data Consistency / Conflict Resolution",
      "ALB vs Cross-Region Traffic Routing",
      "RTO Restore Service vs Failback",
      "Rehost DB on EC2 vs later Replatform to managed database",
      "When Replatform is enough vs when Refactor is justified",
      "CDC exists ≠ zero-lag replication"
    ],
    "upcoming": [
      "Modernization",
      "ECS vs EKS",
      "Docker",
      "Terraform",
      "CI/CD",
      "Observability",
      "FinOps",
      "Bedrock / GenAI",
      "GCP Architecture"
    ],
    "architectureFlow": [
      "Internet",
      "IGW",
      "WAF",
      "ALB",
      "EC2 + ASG",
      "Aurora Writer Endpoint",
      "Aurora Cluster",
      "Global Database DR"
    ],
    "architectureCurrentIndex": 6,
    "thinkingFlow": [
      "Requirement",
      "Constraint",
      "Failure Mode",
      "Architecture",
      "Security",
      "Reliability",
      "Cost",
      "Trade-off"
    ]
  },
  "practicalExamples": [
    {
      "tag": "Networking + Compute + DB",
      "title": "案例 1｜客戶查詢貸款餘額",
      "subtitle": "從手機送出 Request，到資料庫回傳結果",
      "description": "情境：客戶在網銀 App 點「查詢貸款餘額」。",
      "steps": [
        {
          "aws": "Internet / IGW",
          "real": "客戶的 HTTPS Request 進入 AWS VPC"
        },
        {
          "aws": "AWS WAF",
          "real": "先擋惡意 IP、SQL Injection、異常 Request"
        },
        {
          "aws": "ALB",
          "real": "把正常流量分配到健康的 Loan API EC2"
        },
        {
          "aws": "EC2 + ASG",
          "real": "Loan API 執行查詢；流量高時可擴容"
        },
        {
          "aws": "RDS Multi-AZ",
          "real": "查詢貸款主檔；Primary 故障時可 Failover"
        }
      ],
      "memory": "WAF 管「這個 Request 該不該進」；ALB 管「要送去哪台」；ASG 管「要有幾台」；RDS 管「資料」。"
    },
    {
      "tag": "IAM / Security",
      "title": "案例 2｜Production 半夜故障，工程師需要查資料",
      "subtitle": "AssumeRole、Temporary Credentials 與 Audit",
      "description": "情境：Arthur 平常沒有 Production Admin 權限，凌晨 Incident 需要查看 EC2、RDS、CloudWatch。",
      "steps": [
        {
          "aws": "Arthur Identity",
          "real": "公司帳號 / Federated Identity"
        },
        {
          "aws": "sts:AssumeRole",
          "real": "提出切換到 ProdReadOnlyRole 的請求"
        },
        {
          "aws": "Trust Policy + MFA",
          "real": "確認這個人是否被允許 Assume"
        },
        {
          "aws": "Temporary Credentials",
          "real": "拿到限時的 Production 權限"
        },
        {
          "aws": "CloudTrail",
          "real": "記錄誰、何時、做了什麼"
        }
      ],
      "memory": "Trust Policy 決定「誰能進」；Permission Policy 決定「進去後能做什麼」。"
    },
    {
      "tag": "Auto Scaling",
      "title": "案例 3｜EC2 壞掉 vs 貸款活動流量暴增",
      "subtitle": "Replacement 與 Scale Out 是兩件不同的事",
      "description": "同一個 ASG 可能因為「故障」或「負載」增加 EC2，但原因完全不同。",
      "steps": [
        {
          "aws": "ALB Health Check",
          "real": "發現 EC2-A 不健康，停止送流量"
        },
        {
          "aws": "ASG Replacement",
          "real": "Desired=2、Actual=1，所以補 EC2-C"
        },
        {
          "aws": "Scaling Metric",
          "real": "另一種情況：兩台都健康，但 Request / CPU 過高"
        },
        {
          "aws": "Scale Out",
          "real": "Desired 2→3→4，增加 Capacity"
        },
        {
          "aws": "Instance Warm-up",
          "real": "新 EC2 啟動 Application 後才真正能接流量"
        }
      ],
      "compare": [
        {
          "title": "故障",
          "text": "目標是把容量補回 Desired Capacity。"
        },
        {
          "title": "流量過高",
          "text": "目標是提高 Desired Capacity，增加服務能力。"
        }
      ],
      "memory": "Replacement = 壞一台補一台；Scale Out = 沒壞，但現在不夠用。"
    },
    {
      "tag": "Storage / S3",
      "title": "案例 4｜每天產生 Loan Report，保存 7 年",
      "subtitle": "Least Privilege、Lifecycle、Versioning 與 Audit",
      "description": "情境：Production EC2 每晚產生放款報表，近期常查、長期依法保存。",
      "steps": [
        {
          "aws": "EC2 IAM Role",
          "real": "Application 不存長期 Access Key"
        },
        {
          "aws": "s3:PutObject",
          "real": "只能把 Loan Report 上傳指定 Prefix"
        },
        {
          "aws": "S3 Standard",
          "real": "近期 30 天頻繁查詢"
        },
        {
          "aws": "Lifecycle",
          "real": "31 天後自動轉到較便宜的 Storage Class"
        },
        {
          "aws": "Glacier",
          "real": "長期 1～7 年低頻保存"
        }
      ],
      "compare": [
        {
          "title": "保護",
          "text": "Versioning 防誤覆蓋；SSE-KMS 做靜態資料加密。"
        },
        {
          "title": "稽核",
          "text": "CloudTrail + S3 Data Events 記錄 Object 操作。"
        }
      ],
      "memory": "Storage Class 不是越便宜越好，要同時看 Retrieval Time、Access Frequency、Retention 與 Cost。"
    },
    {
      "tag": "Networking",
      "title": "案例 5｜Private EC2 要更新套件",
      "subtitle": "NAT Gateway 不是使用者 Request Path",
      "description": "情境：Private Subnet 裡的 EC2 要下載 OS / Application Patch。",
      "steps": [
        {
          "aws": "Private EC2",
          "real": "沒有直接對 Internet 開放"
        },
        {
          "aws": "Private Route",
          "real": "0.0.0.0/0 指向 NAT Gateway"
        },
        {
          "aws": "NAT Gateway",
          "real": "讓 EC2 主動向外連線"
        },
        {
          "aws": "Internet Gateway",
          "real": "由 Public Subnet 對外進 Internet"
        },
        {
          "aws": "Vendor / Package Repo",
          "real": "下載 Patch 或套件"
        }
      ],
      "memory": "客戶 Request 不會經 NAT；NAT 是給 Private Resource 主動出 Internet。"
    },
    {
      "tag": "DR + Storage",
      "title": "案例 6｜Loan Audit Report 保存 7 年且跨 Region 保護",
      "subtitle": "Retention、Immutability、RPO/RTO 與 Replication 要分開設計",
      "description": "情境：Loan Audit Report 必須保存 7 年、管理員不得提前永久刪除，Region Disaster 時最多接受 10 分鐘資料損失、30 分鐘恢復。",
      "steps": [
        {
          "aws": "S3 + Versioning",
          "real": "保存 Object 歷史版本，作為 Object Lock 與復原基礎"
        },
        {
          "aws": "Object Lock Compliance",
          "real": "7 年 Retention 期間不可提前永久刪除受保護 Version"
        },
        {
          "aws": "SSE-KMS",
          "real": "敏感金融資料使用受控 KMS Key 加密"
        },
        {
          "aws": "CRR",
          "real": "將新 Object 非同步複寫到另一個 Region"
        },
        {
          "aws": "CloudTrail Data Events",
          "real": "稽核 Get / Put / Delete 等 Object-level 操作"
        }
      ],
      "compare": [
        {
          "title": "RPO ≤ 10 分鐘",
          "text": "這是 Business Requirement；不能因 S3 RTC 提供 15 分鐘 SLA 就直接宣稱滿足。"
        },
        {
          "title": "RTO ≤ 30 分鐘",
          "text": "除了資料副本，還必須驗證 Application、DNS、IAM、Runbook 等恢復流程。"
        }
      ],
      "memory": "Retention = 留多久；Object Lock = 能不能刪；RPO = 可掉多少資料；RTO = 可停多久。"
    },
    {
      "tag": "Database / RDS",
      "title": "案例 7｜Loan DB：故障、月底報表、誤刪資料",
      "subtitle": "Multi-AZ、Read Replica、PITR 分別解三種不同問題",
      "description": "情境：核心放款系統平常大量交易寫入、月底報表查詢暴增，同時要求 DB/AZ 故障可 Failover，且 DBA 誤刪資料時可還原。",
      "steps": [
        {
          "aws": "Loan API → RDS Primary",
          "real": "交易 Write 與需要最新一致性的查詢送 Primary"
        },
        {
          "aws": "Primary → Standby",
          "real": "Multi-AZ 同步複寫，用於 HA / Failover"
        },
        {
          "aws": "Primary → Read Replica",
          "real": "非同步複寫；BI / Report Read 直接查 Replica"
        },
        {
          "aws": "Automated Backup",
          "real": "保留可還原的 Backup 與 Transaction Log"
        },
        {
          "aws": "PITR → New DB",
          "real": "誤刪時還原到事故前時間點，建立新的 DB Instance"
        }
      ],
      "compare": [
        {
          "title": "Infrastructure Failure",
          "text": "DB Instance / AZ 故障 → Multi-AZ Failover。"
        },
        {
          "title": "Logical / Human Error",
          "text": "DELETE / UPDATE 錯誤 → Backup / PITR；Standby 通常也已同步錯誤。"
        }
      ],
      "memory": "機器壞 → Multi-AZ；讀太多 → Read Replica；資料搞壞 → Backup / PITR。"
    },
    {
      "tag": "Database / Aurora",
      "title": "案例 8｜Aurora Loan DB：交易、報表與跨 Region DR",
      "subtitle": "Writer / Reader Endpoint、Single-Region HA、Global Database",
      "description": "情境：Loan System 平常大量交易寫入，月底 BI Read 暴增，並要求 AZ 與 Region 層級故障都有對應方案。",
      "steps": [
        {
          "aws": "Loan API → Writer Endpoint",
          "real": "INSERT / UPDATE / DELETE 與需要最新一致性的交易送目前 Writer"
        },
        {
          "aws": "Report / BI → Reader Endpoint",
          "real": "Reader Endpoint 對 Aurora Replicas 做 Connection Balancing，分散 Read Workload"
        },
        {
          "aws": "Aurora Replica",
          "real": "同時作為 Read Scaling 節點與 Writer 故障時的 Failover Target"
        },
        {
          "aws": "Shared Cluster Storage",
          "real": "Writer / Readers 共用 Aurora Cluster Volume，資料跨 3 AZ 保存多份副本"
        },
        {
          "aws": "Aurora Global Database",
          "real": "Primary Region 非同步複寫到 Secondary Region，用於 Region-level DR"
        }
      ],
      "compare": [
        {
          "title": "Single-Region HA",
          "text": "Writer / Replica 跨 AZ；處理 Instance / AZ failure。"
        },
        {
          "title": "Region DR",
          "text": "Aurora Global Database + Cross-Region failover；處理整個 Region 無法使用。"
        }
      ],
      "memory": "Writer Endpoint 管寫入；Reader Endpoint 管讀取連線；Multi-AZ ≠ Multi-Region。"
    },
    {
      "tag": "Database / DR",
      "title": "案例 9｜Loan DR：HA、PITR、Global Database 怎麼分工",
      "subtitle": "同一套核心放款系統，同時處理 AZ Failure、Human Error、Migration 與 Region Disaster",
      "description": "情境：Loan System 要求 RTO 30 分鐘、RPO 5 分鐘；同時要求 AZ 故障自動復原、DBA 誤刪可回復、Migration 前保留明確 Recovery Point，以及 Region 級災難可恢復。",
      "steps": [
        {
          "aws": "Multi-AZ / Aurora Replica",
          "real": "處理 DB Instance / AZ Failure；屬於 High Availability，不處理 Logical Error"
        },
        {
          "aws": "Automated Backup + PITR",
          "real": "DBA 誤刪或 Application 寫壞資料時，還原到事故前的新 DB"
        },
        {
          "aws": "Manual Snapshot",
          "real": "Migration / Schema Change 前建立明確且可長期保留的 Recovery Point"
        },
        {
          "aws": "Aurora Global Database",
          "real": "對 RTO 較嚴格的 Region-level DR；Secondary Region 預先存在"
        },
        {
          "aws": "Cross-Region Backup",
          "real": "成本較低，但災難時需 Restore DB，通常 RTO 較長"
        }
      ],
      "compare": [
        {
          "title": "RPO 驗證",
          "text": "不能只寫『最多掉 5 分鐘』；要監控 cross-Region replication / RPO lag，並用故障演練驗證。"
        },
        {
          "title": "RTO 驗證",
          "text": "量測從災難開始到 DR Region 的 DB、Application、Network、DNS、Secrets 與寫入驗證全部恢復所需時間。"
        }
      ],
      "memory": "HA ≠ Backup；Backup ≠ DR；RPO 要看資料落後；RTO 要看整個服務恢復。"
    },
    {
      "tag": "Architecture / DR",
      "title": "案例 10｜Warm Standby Loan DR：東京 → 大阪",
      "subtitle": "RTO 30 min / RPO 5 min，成本低於 Active/Active",
      "description": "情境：Primary 在東京、DR 在大阪。DR Region 平常已有縮小版 Application、Network、Secrets 與 Aurora Secondary，可在 Region Failure 時快速擴容並切換流量。",
      "steps": [
        {
          "aws": "Primary Region - Tokyo",
          "real": "正常承接 Production Traffic，Application 與 Writer Database 在東京運行。"
        },
        {
          "aws": "DR Region - Osaka",
          "real": "保留縮小但完整可用的 Application Stack，符合 Warm Standby 定義。"
        },
        {
          "aws": "Aurora Global Database",
          "real": "Primary 非同步複寫至 Secondary Region；Failover 時 Secondary 可成為新的 Primary。"
        },
        {
          "aws": "Route 53 / ARC",
          "real": "跨 Region 流量切換需由 Global DNS / Routing 機制完成；ALB 本身是 Regional Load Balancer。"
        },
        {
          "aws": "Scale Out + Validation",
          "real": "Failover 時先確認資料狀態、擴充 DR Compute、切流量、驗證登入與交易。"
        }
      ],
      "compare": [
        {
          "title": "Pilot Light",
          "text": "資料與核心元件在 DR Region，但 Application 不一定能立即服務；故障後還需建立或啟動 Compute。"
        },
        {
          "title": "Warm Standby",
          "text": "完整 Application 已 Running，只是容量較小；故障時主要做 Scale Up + Traffic Failover。"
        }
      ],
      "memory": "Pilot Light 不能立即服務；Warm Standby 可以立即服務但容量較小。"
    },
    {
      "tag": "Migration",
      "title": "案例 11｜Legacy Loan Migration：先 Rehost，再 Modernize",
      "subtitle": "6 個月退出 Data Center，降低 Cutover Risk",
      "description": "情境：Legacy .NET Loan App + Oracle + 大量 Integration + 月底批次，Data Center 6 個月後關閉，Business 不能接受長停機。",
      "steps": [
        {
          "aws": "Phase 1 - Rehost",
          "real": "App 優先搬至 EC2，DB 可先維持 Oracle on EC2，降低短期限內的大幅程式與架構變更。"
        },
        {
          "aws": "AWS Transform MGN",
          "real": "用於 Server / VM rehost；2026 年 AWS Application Migration Service 已更名為 AWS Transform MGN。"
        },
        {
          "aws": "AWS DMS - Full Load + CDC",
          "real": "先搬既有資料，再持續同步來源變更，縮小 Cutover 時的資料差距。"
        },
        {
          "aws": "Cutover",
          "real": "Stop / Control Source Writes → Wait CDC Catch-up → Validate Target → Switch DB Connection → Smoke Test → Open Traffic。"
        },
        {
          "aws": "Phase 2 - Replatform / Refactor",
          "real": "上雲穩定後，先判斷 managed service / limited code changes 是否足以達成目標；必要時再做較高成本 Refactor。"
        }
      ],
      "compare": [
        {
          "title": "Rehost",
          "text": "短期限、Legacy、Integration 多時風險較低；但 Cloud-native benefit 較少。"
        },
        {
          "title": "Refactor",
          "text": "長期彈性與可維護性可能更好，但需要更多時間、測試、人力與風險承擔。"
        }
      ],
      "memory": "Migration Success = Data moved + Cutover validated，不只是 Copy 完成。"
    }
  ],
  "glossary": [
    {
      "term": "RTO",
      "fullName": "Recovery Time Objective｜復原時間目標",
      "category": "DR / Reliability",
      "aliases": [
        "復原時間",
        "Recovery Time",
        "多久恢復"
      ],
      "definition": "發生中斷後，業務可以接受「系統最多多久必須恢復服務」。它衡量的是時間，不是資料量。",
      "example": "放款系統 RTO = 30 分鐘：若主系統故障，目標是在 30 分鐘內恢復可用。",
      "confusion": "RTO 問「多久恢復服務」；RPO 問「最多可以損失多少時間範圍的資料」。",
      "related": [
        "RPO",
        "DR",
        "Failover",
        "High Availability"
      ]
    },
    {
      "term": "RPO",
      "fullName": "Recovery Point Objective｜復原點目標",
      "category": "DR / Reliability",
      "aliases": [
        "復原點",
        "Recovery Point",
        "資料損失"
      ],
      "definition": "發生災難時，業務最多可以接受「回到多久以前的資料狀態」，也就是可接受的資料損失時間窗口。",
      "example": "放款系統 RPO = 5 分鐘：災難時最多只能接受最近 5 分鐘資料可能需要重建或遺失。",
      "confusion": "RPO 不是「多久恢復」；那是 RTO。RPO 越小，通常代表資料保護與複寫要求越高。",
      "related": [
        "RTO",
        "Backup",
        "Replication",
        "DR"
      ]
    },
    {
      "term": "High Availability",
      "fullName": "HA｜高可用性",
      "category": "Architecture",
      "aliases": [
        "HA",
        "高可用",
        "Availability"
      ],
      "definition": "透過冗餘、健康檢查與 Failover，降低單一元件故障造成服務中斷的機率與時間。",
      "example": "Loan API 跨兩個 AZ 放 EC2，前方使用 ALB；其中一個 AZ 故障時，另一邊仍能服務。",
      "confusion": "HA 著重「減少中斷」；DR 著重「重大災難後如何恢復」。",
      "related": [
        "Multi-AZ",
        "DR",
        "RTO",
        "Failover"
      ],
      "cloudCompare": {
        "aws": "High Availability",
        "azure": "Availability Zones / Zone Redundancy",
        "gcp": "Regional managed instance / Multi-zone designs",
        "difference": "HA 取決於服務具體配置、健康檢查、容量及切換時間。",
        "scenario": "Loan API 在 AZ 故障時仍維持服務。"
      }
    },
    {
      "term": "Multi-AZ",
      "fullName": "Multiple Availability Zones",
      "category": "Architecture",
      "aliases": [
        "跨 AZ",
        "多可用區"
      ],
      "definition": "把服務或冗餘資源分散到同一 Region 的多個 Availability Zone，以降低單一 AZ 故障風險。",
      "example": "EC2 分布 AZ-A / AZ-B；RDS 使用 Multi-AZ，Primary 故障時切換到 Standby。",
      "confusion": "Multi-AZ 不等於 Multi-Region；兩者的成本、延遲、DR 能力不同。",
      "related": [
        "Availability Zone",
        "Multi-Region",
        "RDS Multi-AZ",
        "HA"
      ],
      "cloudCompare": {
        "aws": "Multi-AZ",
        "azure": "Availability Zones",
        "gcp": "Zones / Regional resources",
        "difference": "AWS、Azure、GCP Zone 與資源部署模型不完全一致。",
        "scenario": "API 跨區域內多 Zone 部署，搭配 DB HA。"
      }
    },
    {
      "term": "Multi-Region",
      "fullName": "跨 AWS Region 架構",
      "category": "Architecture",
      "aliases": [
        "跨區域",
        "多 Region"
      ],
      "definition": "將系統能力分布到兩個以上 AWS Region，用於更大範圍的 Disaster Recovery、Latency 或 Business Continuity 需求。",
      "example": "台灣主要服務在一個 Region，另一 Region 保留 DR 能力；是否需要要由 RTO/RPO 與業務重要性決定。",
      "confusion": "不是「越多 Region 越好」；會增加成本、資料一致性、部署與營運複雜度。",
      "related": [
        "Multi-AZ",
        "DR",
        "RTO",
        "RPO"
      ],
      "cloudCompare": {
        "aws": "Multi-Region",
        "azure": "Azure Paired Regions / multi-region design",
        "gcp": "Multi-region architecture",
        "difference": "多 Region 不自動代表資料一致性或零 RPO；需明確定義複寫與流量切換。",
        "scenario": "跨 Region 災難復原與演練。"
      }
    },
    {
      "term": "VPC",
      "fullName": "Virtual Private Cloud",
      "category": "Networking",
      "aliases": [
        "虛擬私有雲",
        "網路邊界"
      ],
      "definition": "AWS 中邏輯隔離的虛擬網路，可規劃 CIDR、Subnet、Route、Gateway 與安全控制。",
      "example": "銀行 Loan System 的 ALB、EC2、RDS 可部署在同一 VPC 的不同 Public / Private Subnet。",
      "confusion": "VPC 不是單一 Subnet；一個 VPC 通常包含多個 Subnet 與多個 AZ。",
      "related": [
        "Subnet",
        "Route Table",
        "IGW",
        "NAT Gateway"
      ],
      "cloudCompare": {
        "aws": "VPC",
        "azure": "Azure Virtual Network (VNet)",
        "gcp": "Google Cloud VPC",
        "difference": "GCP VPC 是全球性網路資源；AWS VPC、Azure VNet 的區域範圍與子網路模型不同。",
        "scenario": "銀行將 API 與資料庫分段，搭配路由、Firewall 與私有連線。"
      }
    },
    {
      "term": "Public Subnet",
      "fullName": "Public Subnet",
      "category": "Networking",
      "aliases": [
        "公開子網路"
      ],
      "definition": "其 Route Table 具備通往 Internet Gateway 的路由，讓符合條件的資源可以與 Internet 通訊。",
      "example": "Internet-facing ALB、NAT Gateway 通常放在 Public Subnet。",
      "confusion": "Public / Private 的核心差異看 Route；不是看名稱，也不是所有 Public Subnet 資源都一定有 Public IP。",
      "related": [
        "Private Subnet",
        "IGW",
        "Route Table"
      ],
      "cloudCompare": {
        "aws": "Public Subnet",
        "azure": "Public subnet + public IP / routing（非一對一）",
        "gcp": "Subnet + external IP / routes（非一對一）",
        "difference": "Azure/GCP 沒有完全相同的 AWS Public Subnet 分類；對外可達性由多種網路設定共同決定。",
        "scenario": "網銀公開入口與內部 Loan API 需明確隔離。"
      }
    },
    {
      "term": "Private Subnet",
      "fullName": "Private Subnet",
      "category": "Networking",
      "aliases": [
        "私有子網路"
      ],
      "definition": "沒有直接通往 Internet Gateway 的對外路由，常用於 Application、Database 等不應直接暴露 Internet 的資源。",
      "example": "Loan API EC2 與 RDS 放 Private Subnet；EC2 如需更新套件，可經 NAT Gateway 主動出網。",
      "confusion": "Private 不代表完全不能上 Internet；可以透過 NAT 做 outbound。",
      "related": [
        "Public Subnet",
        "NAT Gateway",
        "RDS",
        "EC2"
      ],
      "cloudCompare": {
        "aws": "Private Subnet",
        "azure": "Private subnet / private endpoints",
        "gcp": "Subnet + no external IP / Private Google Access",
        "difference": "不能單靠子網名稱推斷是否可從 Internet 存取，仍須檢查路由、IP 與防火牆。",
        "scenario": "Loan API、DB 使用私有位址，僅允許必要路徑。"
      }
    },
    {
      "term": "IGW",
      "fullName": "Internet Gateway",
      "category": "Networking",
      "aliases": [
        "Internet Gateway",
        "網際網路閘道"
      ],
      "definition": "附加在 VPC 上，提供 VPC 與 Internet 之間的連線能力。",
      "example": "Internet 使用者要進入 Internet-facing ALB，其 Public Subnet Route 會指向 IGW。",
      "confusion": "IGW 不等於 NAT Gateway；Private EC2 主動上網通常先走 NAT。",
      "related": [
        "NAT Gateway",
        "Public Subnet",
        "VPC"
      ],
      "cloudCompare": {
        "aws": "IGW",
        "azure": "Internet access via public IP / routing（無直接同名元件）",
        "gcp": "Internet gateway routes / external IP（非一對一）",
        "difference": "Azure/GCP 的 Internet Connectivity 模型與 AWS IGW 不完全相同。",
        "scenario": "銀行對外 API 的入站路徑設計。"
      }
    },
    {
      "term": "NAT Gateway",
      "fullName": "Network Address Translation Gateway",
      "category": "Networking",
      "aliases": [
        "NAT",
        "Private Egress"
      ],
      "definition": "讓 Private Subnet 裡的資源主動連到 Internet，同時不讓 Internet 直接透過 NAT 主動建立對內連線。",
      "example": "Private EC2 下載 OS Patch：EC2 → NAT Gateway → IGW → Package Repository。",
      "confusion": "NAT 通常不在客戶進站的 Request Path；它主要是 Private Resource 的 outbound。",
      "related": [
        "IGW",
        "Private Subnet",
        "Route Table"
      ],
      "cloudCompare": {
        "aws": "NAT Gateway",
        "azure": "Azure NAT Gateway",
        "gcp": "Cloud NAT",
        "difference": "三者主要處理私有工作負載主動對外連線；GCP Cloud NAT 不是流量代理主機。",
        "scenario": "Private API 需要下載修補程式，但不接受 Internet 直接連入。"
      }
    },
    {
      "term": "Security Group",
      "fullName": "SG｜Security Group",
      "category": "Security",
      "aliases": [
        "SG",
        "安全群組"
      ],
      "definition": "AWS 資源層級的 Stateful 虛擬防火牆，只定義 Allow Rule。回應流量會被狀態追蹤。",
      "example": "APP-SG 只允許來源 ALB-SG 的 TCP 8080；RDS-SG 只允許 APP-SG 的 3306。",
      "confusion": "SG 是 Stateful + Allow Only；NACL 是 Stateless + Allow / Deny。",
      "related": [
        "NACL",
        "ALB-SG",
        "APP-SG",
        "Least Privilege"
      ],
      "cloudCompare": {
        "aws": "Security Group",
        "azure": "Network Security Group (NSG)",
        "gcp": "VPC Firewall Rules / Firewall Policies",
        "difference": "AWS SG 是 stateful instance/ENI 規則；Azure NSG 與 GCP Firewall 的套用範圍、規則模型不同。",
        "scenario": "僅允許 ALB 到 Loan API、Loan API 到 DB 指定 Port。"
      }
    },
    {
      "term": "NACL",
      "fullName": "Network Access Control List",
      "category": "Security",
      "aliases": [
        "Network ACL",
        "網路 ACL"
      ],
      "definition": "Subnet 層級的 Stateless 網路存取控制，可設定 Allow 與 Deny，Inbound / Outbound 都需獨立考量。",
      "example": "需要在 Subnet 邊界阻擋特定來源 IP 時，可以評估 NACL。",
      "confusion": "NACL 不會像 SG 一樣自動追蹤連線狀態。",
      "related": [
        "Security Group",
        "Subnet",
        "Stateless"
      ],
      "cloudCompare": {
        "aws": "NACL",
        "azure": "NSG subnet rules（非一對一）",
        "gcp": "VPC Firewall Rules（非一對一）",
        "difference": "AWS NACL 為 subnet-level stateless；Azure NSG 與 GCP Firewall 並非等價的 stateless NACL。",
        "scenario": "Subnet 邊界的額外封鎖與防護策略。"
      }
    },
    {
      "term": "AWS WAF",
      "fullName": "Web Application Firewall",
      "category": "Security",
      "aliases": [
        "WAF",
        "Web 防火牆"
      ],
      "definition": "針對 HTTP/HTTPS Web Request 套用安全規則，例如 IP、SQL Injection、XSS、Rate-based Rule。",
      "example": "客戶 Request 進入 Loan API 前，WAF 先封鎖異常 IP 或疑似 SQL Injection。",
      "confusion": "WAF 管 Web Request 安全；ALB 主要做 L7 Routing / Load Balancing。",
      "related": [
        "ALB",
        "Security Group",
        "Web Security"
      ],
      "cloudCompare": {
        "aws": "AWS WAF",
        "azure": "Azure Web Application Firewall",
        "gcp": "Google Cloud Armor",
        "difference": "比較 L7 防護能力、部署入口、規則與計價。",
        "scenario": "網銀 API 防 SQL Injection、惡意流量與常見 Web 攻擊。"
      }
    },
    {
      "term": "ALB",
      "fullName": "Application Load Balancer",
      "category": "Compute / Networking",
      "aliases": [
        "Application Load Balancer",
        "負載平衡器"
      ],
      "definition": "Layer 7 Load Balancer，依 HTTP/HTTPS Host、Path 等條件把流量分配到健康的 Target。",
      "example": "loan.bank.com/api 的 Request 由 ALB 分配到 AZ-A / AZ-B 的 Loan API EC2。",
      "confusion": "ALB 不負責建立新 EC2；補機與擴縮容是 ASG 的責任。",
      "related": [
        "ASG",
        "Target Group",
        "Health Check",
        "WAF"
      ],
      "cloudCompare": {
        "aws": "ALB",
        "azure": "Azure Application Gateway",
        "gcp": "Cloud Load Balancing（External Application Load Balancer）",
        "difference": "皆能做 HTTP(S) L7 路由；網路拓撲、WAF 整合與健康檢查配置不同。",
        "scenario": "將 Loan API 請求導向健康的服務實例。"
      }
    },
    {
      "term": "EC2",
      "fullName": "Amazon Elastic Compute Cloud",
      "category": "Compute",
      "aliases": [
        "Instance",
        "虛擬機",
        "VM"
      ],
      "definition": "AWS 的虛擬運算 Instance，可執行 Application、API、Batch 等 Workload。",
      "example": "Loan API 跑在 EC2 上，由 ALB 接收流量，ASG 管理其數量。",
      "confusion": "EC2 本身不是 Auto Scaling；ASG 才管理群組容量。",
      "related": [
        "ASG",
        "Launch Template",
        "ALB"
      ],
      "cloudCompare": {
        "aws": "EC2",
        "azure": "Azure Virtual Machines",
        "gcp": "Compute Engine",
        "difference": "三者皆是 IaaS VM；比較主機規格、區域可用性、磁碟與維運責任。",
        "scenario": "核心放款批次需要 OS 控制或 Legacy 程式時可考慮 VM。"
      }
    },
    {
      "term": "ASG",
      "fullName": "Auto Scaling Group",
      "category": "Compute",
      "aliases": [
        "Auto Scaling",
        "自動擴縮"
      ],
      "definition": "管理 EC2 Instance 的數量、生命週期、Replacement 與 Scale In / Scale Out。",
      "example": "Desired=2；EC2-A 故障剩 1 台，ASG 會補一台回到 2。流量高時也可把 Desired 提高。",
      "confusion": "Replacement 與 Scale Out 都可能新增 EC2，但前者是補回容量，後者是增加容量。",
      "related": [
        "Desired Capacity",
        "Launch Template",
        "Scale Out",
        "Replacement"
      ],
      "cloudCompare": {
        "aws": "ASG",
        "azure": "Virtual Machine Scale Sets (VMSS)",
        "gcp": "Managed Instance Groups (MIG)",
        "difference": "主要對應 VM 擴縮；容器服務本身另有擴縮機制。",
        "scenario": "貸款查詢尖峰時增加 VM 應用實例。"
      }
    },
    {
      "term": "Launch Template",
      "fullName": "EC2 Launch Template",
      "category": "Compute",
      "aliases": [
        "LT",
        "啟動範本"
      ],
      "definition": "EC2 的建置藍圖，可定義 AMI、Instance Type、Security Group、IAM Role、Storage、User Data 等。",
      "example": "ASG 補機時依 Launch Template 建立規格一致的新 Loan API EC2。",
      "confusion": "Launch Template 定義「怎麼建機器」；ASG 定義「要幾台、何時增減」。",
      "related": [
        "ASG",
        "EC2",
        "AMI"
      ]
    },
    {
      "term": "Desired Capacity",
      "fullName": "ASG Desired Capacity",
      "category": "Compute",
      "aliases": [
        "Desired",
        "目標容量"
      ],
      "definition": "ASG 在某一時間點希望維持的 Instance 數量，是一個明確數字。",
      "example": "Min=2、Desired=2、Max=6；流量高時 Policy 可把 Desired 調成 3 或 4。",
      "confusion": "Desired 不是 2~3 這種範圍；Min / Max 才是上下限。",
      "related": [
        "ASG",
        "Min Capacity",
        "Max Capacity",
        "Scale Out"
      ]
    },
    {
      "term": "Instance Warm-up",
      "fullName": "Auto Scaling Instance Warm-up",
      "category": "Compute",
      "aliases": [
        "Warm-up",
        "預熱"
      ],
      "definition": "新 EC2 建立後，到 Application 真正初始化完成、能穩定承接流量所需的時間。",
      "example": "Loan API 開機需 4 分鐘，因此 09:00 尖峰若 09:00 才擴容可能太晚。",
      "confusion": "Instance 建立成功不等於 Application 已準備好服務。",
      "related": [
        "Scheduled Scaling",
        "ASG",
        "Health Check"
      ]
    },
    {
      "term": "Scheduled Scaling",
      "fullName": "Scheduled Scaling",
      "category": "Compute",
      "aliases": [
        "排程擴縮",
        "定時擴容"
      ],
      "definition": "在已知固定時間前預先調整 Auto Scaling Capacity。",
      "example": "每天 09:00 登入尖峰，可在 08:55 提前把 Desired Capacity 從 2 提高到 4。",
      "confusion": "Scheduled 適合已知固定時段；Dynamic Scaling 是依即時 Metric 反應。",
      "related": [
        "ASG",
        "Warm-up",
        "Dynamic Scaling"
      ]
    },
    {
      "term": "RequestCountPerTarget",
      "fullName": "ALB RequestCountPerTarget",
      "category": "Compute",
      "aliases": [
        "Request Count",
        "每 Target 請求數"
      ],
      "definition": "反映 ALB 後端每個 Target 平均承接的 Request 數，可作為某些 Web/API Workload 的 Scaling Metric。",
      "example": "CPU 只有 35%，但每台 Loan API Request 很高且 Response Time 變慢，此 Metric 可能比 CPU 更代表負載。",
      "confusion": "不是所有 Workload 都該只看 CPU；Scaling Metric 要對應真正的瓶頸。",
      "related": [
        "Target Tracking",
        "ASG",
        "CPUUtilization"
      ]
    },
    {
      "term": "IAM Role",
      "fullName": "AWS Identity and Access Management Role",
      "category": "IAM",
      "aliases": [
        "Role",
        "IAM 身分"
      ],
      "definition": "可被 User、Service 或其他 Principal Assume 的 AWS Identity，通常搭配 Temporary Credentials 使用。",
      "example": "EC2 掛 LoanReportUploaderRole，取得短期憑證後呼叫 S3 PutObject，不把永久 Access Key 寫進程式。",
      "confusion": "Role 是 Identity；Policy 才定義這個 Identity 可以做什麼。",
      "related": [
        "IAM Policy",
        "Temporary Credentials",
        "AssumeRole"
      ],
      "cloudCompare": {
        "aws": "IAM Role",
        "azure": "Azure RBAC + Managed Identities",
        "gcp": "IAM Service Accounts + IAM Roles",
        "difference": "AWS Role、Azure Managed Identity、GCP Service Account 的身分與授權模型不同，不能直接一對一翻譯。",
        "scenario": "Loan API 無須硬編碼資料庫或雲端存取金鑰。"
      }
    },
    {
      "term": "IAM Policy",
      "fullName": "IAM Permission Policy",
      "category": "IAM",
      "aliases": [
        "Policy",
        "權限政策"
      ],
      "definition": "用 Action、Resource、Condition 等描述允許或拒絕哪些 AWS API 操作。",
      "example": "只允許 s3:PutObject 到 arn:aws:s3:::prod-loan-report/loan/*。",
      "confusion": "Action = 做什麼；Resource = 對哪個資源做。",
      "related": [
        "Action",
        "Resource ARN",
        "Least Privilege"
      ],
      "cloudCompare": {
        "aws": "IAM Policy",
        "azure": "Azure RBAC Role Assignments / Definitions",
        "gcp": "IAM Policies / Roles",
        "difference": "三者皆需 Least Privilege，但 Scope、Deny、繼承與條件語法不同。",
        "scenario": "限制批次工作只能讀指定儲存空間。"
      }
    },
    {
      "term": "AssumeRole",
      "fullName": "AWS STS AssumeRole",
      "category": "IAM",
      "aliases": [
        "sts:AssumeRole",
        "切換 Role"
      ],
      "definition": "透過 AWS STS 取得某個 IAM Role 的 Temporary Security Credentials。",
      "example": "Incident Engineer 平常沒有 Prod 權限，故障時 Assume ProductionReadOnlyRole 取得短期讀取權限。",
      "confusion": "有 sts:AssumeRole Permission 還不夠；目標 Role 的 Trust Policy 也必須信任 Caller。",
      "related": [
        "Trust Policy",
        "Temporary Credentials",
        "STS"
      ]
    },
    {
      "term": "Trust Policy",
      "fullName": "Role Trust Policy",
      "category": "IAM",
      "aliases": [
        "信任政策"
      ],
      "definition": "定義哪些 Principal 可以 Assume 這個 IAM Role。",
      "example": "ProductionReadOnlyRole 的 Trust Policy 允許公司 Incident Responder Role，並要求 MFA。",
      "confusion": "Trust Policy 管「誰能進」；Permission Policy 管「進去後能做什麼」。",
      "related": [
        "AssumeRole",
        "Permission Policy",
        "Principal"
      ]
    },
    {
      "term": "Permission Policy",
      "fullName": "IAM Permission Policy",
      "category": "IAM",
      "aliases": [
        "權限政策",
        "Identity Policy"
      ],
      "definition": "定義 Identity 或 Role 可以對 AWS Resource 執行哪些 Action。",
      "example": "ProdReadOnlyRole 可 Describe EC2、讀 CloudWatch，但不可 Stop Instance。",
      "confusion": "不要和 Trust Policy 混在一起：Trust 是誰能 Assume；Permission 是能做什麼。",
      "related": [
        "Trust Policy",
        "IAM Role",
        "Least Privilege"
      ]
    },
    {
      "term": "Temporary Credentials",
      "fullName": "Temporary Security Credentials",
      "category": "IAM",
      "aliases": [
        "臨時憑證",
        "短期憑證",
        "Session Token"
      ],
      "definition": "有有效期限的 Access Key ID、Secret Access Key 與 Session Token，常由 STS / IAM Role 取得。",
      "example": "EC2 IAM Role 自動取得短期 Credential 呼叫 S3，不需寫死永久金鑰。",
      "confusion": "Temporary Credential 仍有 Access Key / Secret，只是短期且通常還包含 Session Token。",
      "related": [
        "IAM Role",
        "STS",
        "AssumeRole"
      ]
    },
    {
      "term": "Least Privilege",
      "fullName": "Principle of Least Privilege",
      "category": "Security / IAM",
      "aliases": [
        "最小權限"
      ],
      "definition": "只授予完成工作所需要的最小 Action、Resource 與範圍，不預先多給權限。",
      "example": "Loan EC2 需求只有上傳報表，就先給 s3:PutObject，不順手加 s3:GetObject。",
      "confusion": "方便不代表要給 AdministratorAccess；Production 通常反而需要更精準。",
      "related": [
        "IAM Policy",
        "Security Group",
        "SCP"
      ]
    },
    {
      "term": "Explicit Deny",
      "fullName": "Explicit Deny",
      "category": "IAM",
      "aliases": [
        "明確拒絕",
        "Deny"
      ],
      "definition": "AWS 權限評估中，明確 Deny 會優先於 Allow。",
      "example": "Role 有 AdministratorAccess，但 SCP Explicit Deny cloudtrail:StopLogging，仍不能停 CloudTrail。",
      "confusion": "Allow 很大不代表能覆蓋 Explicit Deny。",
      "related": [
        "SCP",
        "IAM Policy",
        "Effective Permissions"
      ]
    },
    {
      "term": "SCP",
      "fullName": "Service Control Policy",
      "category": "IAM / Organizations",
      "aliases": [
        "Service Control Policy",
        "Organizations SCP"
      ],
      "definition": "AWS Organizations 層級的 Permission Guardrail，用來限制 Account / OU 可取得的最大權限範圍。",
      "example": "Production OU 的 SCP Deny 關閉 CloudTrail，即使某 Role 有 Admin Allow 也不能執行。",
      "confusion": "SCP 設上限，不直接授予 User / Role 權限，也不是 Authentication。",
      "related": [
        "Explicit Deny",
        "AWS Organizations",
        "IAM Policy"
      ]
    },
    {
      "term": "S3",
      "fullName": "Amazon Simple Storage Service",
      "category": "Storage",
      "aliases": [
        "Object Storage",
        "物件儲存"
      ],
      "definition": "AWS 的 Object Storage，資料以 Object 形式放在 Bucket 中，每個 Object 有 Key 與 Metadata。",
      "example": "每天產生的 Loan Report 上傳到 S3，再用 Lifecycle 轉到較便宜 Storage Class。",
      "confusion": "S3 不是傳統 File System，也不是 RDS Database。",
      "related": [
        "Bucket",
        "Object",
        "Versioning",
        "Lifecycle"
      ],
      "cloudCompare": {
        "aws": "S3",
        "azure": "Azure Blob Storage",
        "gcp": "Cloud Storage",
        "difference": "皆提供 Object Storage；儲存層級、生命週期、版本及鎖定能力要個別核對。",
        "scenario": "保存貸款對帳檔、報表與稽核文件。"
      }
    },
    {
      "term": "Versioning",
      "fullName": "S3 Versioning",
      "category": "Storage",
      "aliases": [
        "版本控制",
        "歷史版本"
      ],
      "definition": "保留同一 Object Key 的多個版本，用來協助回復誤覆蓋或誤刪。",
      "example": "loan-report.csv 被新版覆蓋後，可從舊 Version 回復。",
      "confusion": "Versioning 不等於完整 Backup；Backup 還要考慮獨立 Recovery、故障域與還原流程。",
      "related": [
        "Backup",
        "S3",
        "Object Lock"
      ],
      "cloudCompare": {
        "aws": "Versioning",
        "azure": "Blob Versioning",
        "gcp": "Object Versioning",
        "difference": "版本保留與刪除、保留政策、費用的細節不同。",
        "scenario": "避免 Loan Report 被覆寫後無法追溯。"
      }
    },
    {
      "term": "Lifecycle",
      "fullName": "S3 Lifecycle",
      "category": "Storage",
      "aliases": [
        "Lifecycle Policy",
        "生命週期"
      ],
      "definition": "依 Object 年齡或條件自動做 Storage Class Transition 或 Expiration 等生命週期管理。",
      "example": "Loan Report 0–90 天放 Standard，之後轉 Standard-IA，再轉 Glacier Archive。",
      "confusion": "Lifecycle 是自動管理資料生命週期；Versioning 是保存不同版本。",
      "related": [
        "S3 Standard",
        "Standard-IA",
        "Glacier",
        "Versioning"
      ],
      "cloudCompare": {
        "aws": "Lifecycle",
        "azure": "Blob Lifecycle Management",
        "gcp": "Object Lifecycle Management",
        "difference": "三者可自動轉換儲存層級或刪除物件，規則與成本不同。",
        "scenario": "七年稽核檔案依規定轉低頻儲存。"
      }
    },
    {
      "term": "Standard-IA",
      "fullName": "S3 Standard-Infrequent Access",
      "category": "Storage",
      "aliases": [
        "IA",
        "Infrequent Access"
      ],
      "definition": "適合較低頻存取、但仍需要毫秒級存取的 S3 Storage Class；通常儲存成本較低，但有存取相關費用與條件。",
      "example": "90 天後的 Loan Report 每月偶爾查一次，又不能等數小時 Restore，可以評估 Standard-IA。",
      "confusion": "低頻不代表一定要 Glacier；要先看 Retrieval SLA。",
      "related": [
        "S3 Standard",
        "Glacier",
        "Lifecycle"
      ]
    },
    {
      "term": "Glacier",
      "fullName": "S3 Glacier Storage Classes",
      "category": "Storage",
      "aliases": [
        "Archive",
        "歸檔"
      ],
      "definition": "S3 的 Archive 類 Storage Class，適合長期低頻資料；不同 Glacier 類型有不同 Retrieval Time 與 Cost。",
      "example": "依法保存 1～7 年、幾乎不查的歷史 Loan Report，可依取回時效要求選 Archive Tier。",
      "confusion": "不能只選最便宜的 Tier；還要看 Retrieval Time、取回成本與最低保存條件。",
      "related": [
        "Lifecycle",
        "Standard-IA",
        "Archive"
      ]
    },
    {
      "term": "SSE-KMS",
      "fullName": "Server-Side Encryption with AWS KMS keys",
      "category": "Storage / Security",
      "aliases": [
        "KMS Encryption",
        "S3 KMS"
      ],
      "definition": "由 S3 在伺服器端使用 AWS KMS Key 加密 Object，提供較細的 Key Control、Audit 與 Permission 管理能力。",
      "example": "敏感 Loan Report 使用 SSE-KMS，以符合更嚴格的 Key Governance 與稽核需求。",
      "confusion": "選 SSE-KMS 也會增加 KMS Permission、Key Policy、Request Cost 與營運複雜度。",
      "related": [
        "KMS",
        "S3",
        "Encryption"
      ],
      "cloudCompare": {
        "aws": "SSE-KMS",
        "azure": "Azure Key Vault / Managed HSM + customer-managed keys",
        "gcp": "Cloud KMS + CMEK",
        "difference": "金鑰管理、加密整合、權限及輪替機制並不完全相同。",
        "scenario": "客戶敏感文件使用客戶管理金鑰加密。"
      }
    },
    {
      "term": "CloudTrail",
      "fullName": "AWS CloudTrail",
      "category": "Audit / Security",
      "aliases": [
        "Audit Log",
        "API Audit"
      ],
      "definition": "記錄 AWS Account 中的 API Activity，協助稽核「誰在什麼時間對哪個 AWS Resource 做了什麼」。",
      "example": "Incident 後查 CloudTrail，確認哪個 Role 修改了 Security Group 或 Assume 了 Production Role。",
      "confusion": "CloudTrail 有開不代表所有 S3 Object Get/Put 都自動涵蓋；那涉及 Data Events。",
      "related": [
        "Data Events",
        "Audit",
        "AssumeRole"
      ],
      "cloudCompare": {
        "aws": "CloudTrail",
        "azure": "Azure Activity Log / Resource Logs",
        "gcp": "Cloud Audit Logs",
        "difference": "AWS CloudTrail 側重 API 活動稽核；Azure/GCP 需選對控制面與資料面記錄來源。",
        "scenario": "調查誰在何時變更 Production IAM 與資料。"
      }
    },
    {
      "term": "Data Events",
      "fullName": "CloudTrail Data Events",
      "category": "Audit / Security",
      "aliases": [
        "S3 Data Events",
        "Object-level Audit"
      ],
      "definition": "CloudTrail 用來記錄高頻資料層操作的 Event 類型，例如 S3 Object-level API。",
      "example": "要稽核誰 GetObject / PutObject / DeleteObject，需要明確設定 S3 Data Events。",
      "confusion": "Management Events 與 Data Events 範圍不同；不能只說「有 CloudTrail」就代表全部 Object 操作都有記。",
      "related": [
        "CloudTrail",
        "S3",
        "Audit"
      ]
    },
    {
      "term": "ARN",
      "fullName": "Amazon Resource Name",
      "category": "IAM",
      "aliases": [
        "Resource ARN",
        "AWS ARN"
      ],
      "definition": "AWS 用來唯一識別 Resource 的標準名稱格式，常出現在 IAM Policy 的 Resource。",
      "example": "S3 Object Resource：arn:aws:s3:::prod-loan-report/loan/*。",
      "confusion": "s3://bucket/path 是 URI 表示法；IAM Resource 通常要 ARN。",
      "related": [
        "IAM Policy",
        "S3",
        "Resource"
      ]
    },
    {
      "term": "RDS",
      "fullName": "Amazon Relational Database Service",
      "category": "Database",
      "aliases": [
        "Relational Database",
        "託管資料庫"
      ],
      "definition": "AWS 託管式關聯式資料庫服務，降低自管 DB OS、Patch、Backup、HA 等基礎營運工作。",
      "example": "Loan Application 透過 RDS Endpoint 連到 RDS MySQL；使用 Multi-AZ 提升 HA。",
      "confusion": "RDS 本身就是 Database Service，不需再畫 RDS → DB。",
      "related": [
        "RDS Multi-AZ",
        "Read Replica",
        "Endpoint"
      ],
      "cloudCompare": {
        "aws": "RDS",
        "azure": "Azure SQL Database / Azure Database for PostgreSQL",
        "gcp": "Cloud SQL",
        "difference": "要依資料庫引擎選型；Azure SQL 不等於所有 RDS 引擎。",
        "scenario": "核心 Loan DB 選 PostgreSQL 時比較 Azure Database for PostgreSQL 與 Cloud SQL for PostgreSQL。"
      }
    },
    {
      "term": "Read Replica",
      "fullName": "RDS Read Replica",
      "category": "Database",
      "aliases": [
        "讀取副本",
        "Read Scaling"
      ],
      "definition": "建立資料庫的唯讀副本，主要用於分散 Read Workload，也可用於部分 DR / reporting 情境，具體能力依 Engine 而異。",
      "example": "報表查詢量很大時，把部分 Read Traffic 導向 Read Replica，避免壓垮 Primary。",
      "confusion": "Read Replica 主要解決 Read Scaling；Multi-AZ 主要解決 HA / Failover。",
      "related": [
        "RDS",
        "Multi-AZ",
        "Read Scaling"
      ],
      "cloudCompare": {
        "aws": "Read Replica",
        "azure": "Read Replicas（依資料庫產品）",
        "gcp": "Cloud SQL Read Replicas",
        "difference": "Replica 主要支援讀取擴展，HA/Failover 行為依產品而異。",
        "scenario": "Loan Report 讀取與正式交易分流。"
      }
    },
    {
      "term": "S3 Object Lock",
      "fullName": "Amazon S3 Object Lock｜WORM",
      "category": "Storage / Compliance",
      "aliases": [
        "Object Lock",
        "WORM",
        "不可變更"
      ],
      "definition": "以 Write Once Read Many 模式保護特定 S3 Object Version，在指定 Retention 或 Legal Hold 條件下避免被覆寫或永久刪除。",
      "example": "Loan Audit Report 法規保存 7 年，搭配 Versioning 與 Object Lock 保護每個 Version。",
      "confusion": "Versioning 是保留歷史版本；Object Lock 是讓受保護 Version 在期限內不可被永久刪除。",
      "related": [
        "Versioning",
        "Compliance Mode",
        "Governance Mode",
        "Legal Hold"
      ]
    },
    {
      "term": "Compliance Mode",
      "fullName": "S3 Object Lock Compliance Mode",
      "category": "Storage / Compliance",
      "aliases": [
        "Compliance",
        "合規模式"
      ],
      "definition": "Retention 期間內受保護 Object Version 不能被永久刪除，Retention 不能被縮短，包含 AWS Account Root User。",
      "example": "銀行要求 7 年內任何管理員都不能提前永久刪除稽核資料，可評估 Compliance Mode。",
      "confusion": "Governance Mode 可由具備特定 Bypass 權限的人員繞過；Compliance Mode 更嚴格。",
      "related": [
        "S3 Object Lock",
        "Governance Mode",
        "Retention"
      ]
    },
    {
      "term": "Governance Mode",
      "fullName": "S3 Object Lock Governance Mode",
      "category": "Storage / Compliance",
      "aliases": [
        "Governance",
        "治理模式"
      ],
      "definition": "Retention 期間一般使用者無法刪除受保護 Version，但具備特定 Bypass 權限的人員可在受控條件下繞過。",
      "example": "企業內部需要不可變更保護，但仍保留少數緊急管理例外時可評估 Governance。",
      "confusion": "它不是 Compliance Mode；高權限人員可能有繞過機制。",
      "related": [
        "Compliance Mode",
        "S3 Object Lock",
        "Retention"
      ]
    },
    {
      "term": "Legal Hold",
      "fullName": "S3 Object Lock Legal Hold",
      "category": "Storage / Compliance",
      "aliases": [
        "法律保留",
        "Legal Hold"
      ],
      "definition": "對特定 Object Version 施加無固定到期日的保護，直到被授權的人員解除。",
      "example": "某筆貸款資料進入司法調查，即使原 Retention 期限將到，也可維持 Legal Hold。",
      "confusion": "Retention 有到期時間；Legal Hold 本身沒有固定到期日。",
      "related": [
        "Retention",
        "S3 Object Lock"
      ]
    },
    {
      "term": "CRR",
      "fullName": "S3 Cross-Region Replication",
      "category": "Storage / DR",
      "aliases": [
        "Cross-Region Replication",
        "跨 Region 複寫"
      ],
      "definition": "將 S3 Object 非同步複寫到另一個 AWS Region 的 Bucket，以建立跨 Region 副本。",
      "example": "Region A 的 Loan Report 持續複寫到 Region B，降低單一 Region 災難風險。",
      "confusion": "Replication 不等於完整 Backup；仍要考慮刪除行為、Recovery、權限、KMS 與故障域。",
      "related": [
        "S3 RTC",
        "RPO",
        "Backup",
        "Replication"
      ]
    },
    {
      "term": "S3 RTC",
      "fullName": "S3 Replication Time Control",
      "category": "Storage / DR",
      "aliases": [
        "RTC",
        "Replication Time Control"
      ],
      "definition": "S3 Replication 的時間控制能力，提供較可預測的複寫時間與監控指標；其 SLA 不能直接替代 Business RPO。",
      "example": "若需要更可預測的跨 Region 複寫時間，可評估 RTC；但 RPO ≤ 10 分鐘時不能只用 15 分鐘 SLA 宣稱達標。",
      "confusion": "RTC 是技術能力 / SLA；RPO 是 Business Requirement。",
      "related": [
        "CRR",
        "RPO",
        "Replication"
      ]
    },
    {
      "term": "RDS Multi-AZ DB instance",
      "fullName": "RDS Multi-AZ DB Instance Deployment",
      "category": "Database / HA",
      "aliases": [
        "Multi-AZ Standby",
        "Primary Standby"
      ],
      "definition": "一個 Primary DB 搭配另一個 AZ 的 Standby，用同步複寫提高 High Availability；Standby 不用來承接一般 Read Traffic。",
      "example": "Loan DB Primary 在 AZ-A，Standby 在 AZ-B；Primary 或 AZ 故障時由 RDS 執行 Failover。",
      "confusion": "它主要是 HA，不是 Read Scaling，也不是 Backup。",
      "related": [
        "Read Replica",
        "PITR",
        "Failover",
        "RDS"
      ],
      "cloudCompare": {
        "aws": "RDS Multi-AZ DB instance",
        "azure": "Azure Database for PostgreSQL HA / Azure SQL zone redundancy",
        "gcp": "Cloud SQL HA",
        "difference": "HA 方式、同步複寫與故障切換設計各有差異，不應把 Read Replica 當作 HA Standby。",
        "scenario": "單一 AZ 故障時恢復資料庫服務。"
      }
    },
    {
      "term": "RDS Multi-AZ DB cluster",
      "fullName": "RDS Multi-AZ DB Cluster",
      "category": "Database / HA",
      "aliases": [
        "Multi-AZ Cluster",
        "Writer + Readers"
      ],
      "definition": "RDS 的 Multi-AZ Cluster 架構含 Writer 與可讀 Reader instances，跨多個 AZ，同時提供 HA 與額外 Read Capacity。",
      "example": "交易由 Writer 處理，Reader 可承接部分查詢；節點故障時可進行 Failover。",
      "confusion": "不要把它和傳統 Multi-AZ DB instance 的「不可讀 Standby」混為一談。",
      "related": [
        "RDS Multi-AZ DB instance",
        "Read Replica",
        "HA"
      ]
    },
    {
      "term": "PITR",
      "fullName": "Point-in-Time Recovery｜時間點還原",
      "category": "Database / Recovery",
      "aliases": [
        "Point in Time Recovery",
        "時間點恢復",
        "RDS PITR"
      ],
      "definition": "利用 Automated Backup 與資料庫 Log，在保留期限內把資料庫還原到指定時間點；通常會建立新的 DB Instance / Cluster。",
      "example": "14:03 DBA 誤刪 Loan Transaction，14:20 發現後將 DB 還原到 14:02:50，再驗證並切換 Application。",
      "confusion": "PITR 解 Logical / Human Error；Multi-AZ Failover 解 Infrastructure Failure。",
      "related": [
        "Automated Backup",
        "RDS",
        "RTO",
        "RPO"
      ],
      "cloudCompare": {
        "aws": "PITR",
        "azure": "Azure SQL / PostgreSQL Point-in-Time Restore",
        "gcp": "Cloud SQL Point-in-Time Recovery",
        "difference": "還原通常涉及建立/恢復資料庫資源及切換程序；不等於修正少量錯帳。",
        "scenario": "重大 DB 事故還原，錯誤計息優先用受控補正交易。"
      }
    },
    {
      "term": "Replica Lag",
      "fullName": "Read Replica Replication Lag",
      "category": "Database / Read Scaling",
      "aliases": [
        "Replication Lag",
        "複寫延遲"
      ],
      "definition": "Read Replica 因非同步複寫而落後 Primary 的時間差，因此 Replica 可能暫時讀不到剛寫入的最新資料。",
      "example": "客戶剛完成還款後立即查餘額，如果查到 Replica，可能短時間看到舊餘額。",
      "confusion": "需要 Read-after-write 一致性的流程通常要回 Primary 或使用符合一致性需求的設計。",
      "related": [
        "Read Replica",
        "Primary",
        "Eventual Consistency"
      ]
    },
    {
      "term": "Automated Backup",
      "fullName": "RDS Automated Backups",
      "category": "Database / Recovery",
      "aliases": [
        "自動備份",
        "RDS Backup"
      ],
      "definition": "RDS 自動建立備份並保留資料庫變更資訊，以支援 Backup Retention Period 內的 Point-in-Time Recovery。",
      "example": "Production Loan DB 開啟 Automated Backup，誤刪資料時可還原到事故發生前。",
      "confusion": "Backup 與 Multi-AZ 目的不同：前者 Recovery，後者 HA。",
      "related": [
        "PITR",
        "Multi-AZ",
        "RPO",
        "Backup Retention"
      ]
    },
    {
      "term": "Aurora Writer Endpoint",
      "fullName": "Aurora Cluster Endpoint / Writer Endpoint",
      "category": "Database / Aurora",
      "aliases": [
        "Cluster Endpoint",
        "Writer Endpoint"
      ],
      "definition": "永遠指向目前 Aurora Cluster 的 Writer DB instance，應用程式的 INSERT / UPDATE / DELETE 等寫入通常連這個 Endpoint。",
      "example": "Loan API 寫入還款交易時連 Writer Endpoint；Writer Failover 後 Endpoint 會改指向新的 Writer。",
      "confusion": "不要把程式綁死到某個 Instance hostname；Endpoint 是角色入口。",
      "related": [
        "Aurora Replica",
        "Reader Endpoint",
        "Failover"
      ]
    },
    {
      "term": "Aurora Reader Endpoint",
      "fullName": "Aurora Reader Endpoint",
      "category": "Database / Aurora",
      "aliases": [
        "Reader Endpoint",
        "Read Endpoint"
      ],
      "definition": "為 Aurora Cluster 的 Read-only connections 提供 Connection Balancing，讓 Reporting / BI Read 分散到 Aurora Replicas。",
      "example": "月底 BI 報表直接連 Reader Endpoint，而不是先經 Writer 再轉 Reader。",
      "confusion": "它平衡的是 Connection，不是每一條 SQL Query 都重新 Round Robin。",
      "related": [
        "Aurora Replica",
        "Read Scaling",
        "Writer Endpoint"
      ]
    },
    {
      "term": "Aurora Replica",
      "fullName": "Aurora Replica / Reader Instance",
      "category": "Database / Aurora",
      "aliases": [
        "Aurora Reader",
        "Reader Instance"
      ],
      "definition": "Aurora Cluster 中的唯讀 DB instance，主要用於 Read Scaling，也可在 Writer 故障時被 Promote 成新的 Writer。",
      "example": "Loan Report 平常查 Reader；Writer 掛掉時其中一台 Reader 可被提升為 Writer。",
      "confusion": "Aurora Replica 不只是 Read-only Capacity，也屬於 HA Failover Target。",
      "related": [
        "Reader Endpoint",
        "Failover",
        "Shared Cluster Storage"
      ]
    },
    {
      "term": "Aurora Shared Cluster Storage",
      "fullName": "Aurora Shared Distributed Cluster Volume",
      "category": "Database / Storage",
      "aliases": [
        "Cluster Volume",
        "Shared Storage",
        "6 copies across 3 AZs"
      ],
      "definition": "Aurora 的 Writer 與 Reader DB instances 共用同一個邏輯 Cluster Volume；資料跨多個 AZ 保存多份副本。",
      "example": "Writer Compute 發生故障，不代表資料 Storage 跟著消失；新的 Writer 可以接續使用 Cluster Volume。",
      "confusion": "不要畫成每個 Aurora Reader 各自再複製一整份獨立資料庫 Storage。",
      "related": [
        "Aurora",
        "Aurora Replica",
        "High Availability"
      ]
    },
    {
      "term": "Aurora Global Database",
      "fullName": "Amazon Aurora Global Database",
      "category": "Database / DR",
      "aliases": [
        "Global Database",
        "Aurora Global"
      ],
      "definition": "讓 Aurora 橫跨多個 AWS Regions；Primary Region 負責主要寫入，資料以非同步方式複寫到 Secondary Regions，用於 Global Read 與 Region-level DR。",
      "example": "Primary Region 發生重大事故時，可 Failover 到 Secondary Region，將其中的 DB cluster 提升為新的 Primary。",
      "confusion": "跨 Region replication 是非同步，因此 Unplanned Failover 的 RPO 通常不是 0；要監控 replication / RPO lag。",
      "related": [
        "RPO",
        "RTO",
        "Failover",
        "Switchover",
        "Multi-Region"
      ]
    },
    {
      "term": "Manual Snapshot",
      "fullName": "RDS / Aurora Manual Snapshot",
      "category": "Database / Backup",
      "aliases": [
        "DB Snapshot",
        "手動快照"
      ],
      "definition": "由使用者主動建立的特定時間點資料庫快照，會持續保留直到明確刪除，適合變更前或 Migration 前建立明確 Recovery Point。",
      "example": "核心轉換前 23:30 建立 Manual Snapshot，若 Schema Upgrade 失敗可從該 Snapshot Restore 新 DB。",
      "confusion": "Manual Snapshot 是明確 Checkpoint；Automated Backup + PITR 是持續性時間點還原能力。",
      "related": [
        "PITR",
        "Automated Backup",
        "Migration"
      ]
    },
    {
      "term": "Cross-Region Automated Backup",
      "fullName": "Amazon RDS Cross-Region Automated Backups",
      "category": "Database / DR",
      "aliases": [
        "Cross-Region Backup",
        "Replicated Backup"
      ],
      "definition": "將 RDS automated backups 的 snapshots 與 transaction logs 複寫到另一個 AWS Region，讓目的 Region 可從 replicated backup 進行 PITR / restore。",
      "example": "Primary Region 發生災難時，從 Secondary Region 的 replicated backup 建立新的 RDS DB instance。",
      "confusion": "它不是持續運行的 Hot Standby；災難後仍需 Restore，因此通常 RTO 比 Aurora Global Database 長。",
      "related": [
        "PITR",
        "RTO",
        "RPO",
        "Aurora Global Database"
      ]
    },
    {
      "term": "Failback",
      "fullName": "Disaster Recovery Failback",
      "category": "Architecture / DR",
      "aliases": [
        "切回原區域",
        "Return to Primary"
      ],
      "definition": "災難期間先 Failover 到 DR Region 恢復服務；原 Primary Region 恢復後，再經規劃將服務切回原架構的流程。",
      "example": "Region A 故障後先在 Region B 於 30 分鐘內恢復；Region A 修復後另排時間執行 Failback。",
      "confusion": "RTO 通常衡量『恢復服務』，不是要求在 RTO 內切回原 Region。",
      "related": [
        "Failover",
        "RTO",
        "DR Runbook"
      ]
    },
    {
      "term": "DR Runbook",
      "fullName": "Disaster Recovery Runbook",
      "category": "Architecture / DR",
      "aliases": [
        "Recovery Runbook",
        "災難復原手冊"
      ],
      "definition": "把 DR 事件中要執行的技術與營運步驟明確化，包括誰判斷、如何 Failover、流量切換、驗證、Rollback / Failback 與通報。",
      "example": "Loan System Runbook 定義 Aurora Global Database failover、DNS、Secrets、Application health check 與測試交易。",
      "confusion": "有 Backup 或 Secondary Region 不代表有完整 DR；沒有 Runbook 與演練，RTO 很難被證明。",
      "related": [
        "RTO",
        "RPO",
        "Failover",
        "Failback"
      ]
    },
    {
      "term": "Pilot Light",
      "fullName": "Pilot Light Disaster Recovery",
      "category": "Architecture / DR",
      "aliases": [
        "小火苗 DR"
      ],
      "definition": "DR Region 中保留資料與核心基礎元件，但完整 Application Stack 尚未處於可立即服務狀態；故障時還需建立或啟動部分 Compute / Application。",
      "example": "Aurora Secondary、Secrets、IaC 已存在，但 EC2 Application 尚未 Running。",
      "confusion": "若 Application 已完整 Running、只是容量較小，那是 Warm Standby，不是 Pilot Light。",
      "related": [
        "Warm Standby",
        "RTO",
        "RPO"
      ]
    },
    {
      "term": "Warm Standby",
      "fullName": "Warm Standby Disaster Recovery",
      "category": "Architecture / DR",
      "aliases": [
        "縮小版備援環境"
      ],
      "definition": "在 DR Region 長期維持一套完整且可運行、但容量小於 Primary 的 workload；發生災難時主要 Scale Up 並切換流量。",
      "example": "東京 EC2 x4，大阪 EC2 x2；大阪平常可運作，故障時再擴到完整容量。",
      "confusion": "Warm Standby 比 Active/Active 便宜，但 RTO 較長，因為還需要 Scale Up / Failover。",
      "related": [
        "Pilot Light",
        "Active/Active",
        "Route 53"
      ]
    },
    {
      "term": "Write Fencing",
      "fullName": "Write Fencing / Split-brain Prevention",
      "category": "Architecture / DR",
      "aliases": [
        "寫入隔離",
        "防 Split-brain"
      ],
      "definition": "Failover 時阻止舊 Primary 與新 Primary 同時接受寫入，避免兩邊資料分岔或衝突。",
      "example": "東京 Region 異常但尚未完全離線時，先阻止舊 Writer 再把大阪提升為新的 Write Region。",
      "confusion": "Region Failure 不一定代表舊 Region 100% 不可寫，因此 Failover Runbook 要考慮 split-brain。",
      "related": [
        "Failover",
        "Active/Active",
        "Consistency"
      ]
    },
    {
      "term": "Cross-Region Traffic Failover",
      "fullName": "Cross-Region Traffic Failover",
      "category": "Networking / DR",
      "aliases": [
        "Route 53 Failover",
        "Global Traffic Switch"
      ],
      "definition": "把使用者流量從故障 Region 導向健康的 Recovery Region，常用 Route 53 Failover Routing 或其他 Global Routing / ARC 機制。",
      "example": "東京 ALB unhealthy 後，Route 53 將同一網域解析到大阪 ALB。",
      "confusion": "ALB 是 Regional Service，本身不負責跨 Region 的全域流量切換。",
      "related": [
        "Route 53",
        "ALB",
        "ARC",
        "Warm Standby"
      ]
    },
    {
      "term": "Rehost",
      "fullName": "Rehost / Lift and Shift",
      "category": "Migration",
      "aliases": [
        "Lift and Shift"
      ],
      "definition": "將既有 workload 搬到 AWS，但盡量不改變 Application Architecture 或程式邏輯。",
      "example": "Legacy .NET VM 搬至 EC2，Oracle 先維持在 EC2。",
      "confusion": "Rehost 的重點是低變更、快速搬遷，不代表已經充分使用 managed / cloud-native services。",
      "related": [
        "Replatform",
        "Refactor",
        "AWS Transform MGN"
      ]
    },
    {
      "term": "Replatform",
      "fullName": "Replatform / Lift, Tinker and Shift",
      "category": "Migration",
      "aliases": [
        "Platform Optimization"
      ],
      "definition": "在 Migration 過程做有限度平台最佳化，但不進行完整 Application Rewrite。",
      "example": "App 仍跑 EC2，但 Self-managed Oracle 改為 Amazon RDS。",
      "confusion": "Replatform 會改平台或 managed service 使用方式，但通常不會像 Refactor 一樣全面改 Application Architecture。",
      "related": [
        "Rehost",
        "Refactor",
        "Amazon RDS"
      ]
    },
    {
      "term": "Refactor",
      "fullName": "Refactor / Re-architect",
      "category": "Migration / Modernization",
      "aliases": [
        "Re-architect"
      ],
      "definition": "為了 Cloud-native capability、scalability、resilience 或 agility，大幅調整 Application architecture、code、deployment 或 data model。",
      "example": "Monolith 拆成 Microservices，改用 ECS / EKS / Lambda 與 managed services。",
      "confusion": "Refactor 通常帶來最大長期改善潛力，但時間、成本與 migration risk 也最高。",
      "related": [
        "Modernization",
        "Microservices",
        "ECS",
        "EKS"
      ]
    },
    {
      "term": "AWS Transform MGN",
      "fullName": "AWS Transform MGN",
      "category": "Migration",
      "aliases": [
        "MGN",
        "Application Migration Service"
      ],
      "definition": "AWS 的 rehosting replication engine，用於將來源 server / VM 持續複寫並在 AWS 啟動 cutover instance。2026 年由 AWS Application Migration Service 更名為 AWS Transform MGN。",
      "example": "把 On-Prem Windows / Linux Legacy Server rehost 到 Amazon EC2。",
      "confusion": "MGN 主要處理 server rehost；database logical migration / CDC 通常由 DMS 等工具處理。",
      "related": [
        "Rehost",
        "EC2",
        "AWS DMS"
      ]
    },
    {
      "term": "CDC",
      "fullName": "Change Data Capture",
      "category": "Migration / Database",
      "aliases": [
        "Ongoing Replication"
      ],
      "definition": "從來源資料庫 transaction / change logs 捕捉持續異動並套用到 Target，用於降低 Migration Cutover 的資料差距。",
      "example": "DMS Full Load 完成後持續把 Oracle redo log 的變更同步至 Target DB。",
      "confusion": "AWS DMS CDC 不是 real-time replication，可能有 latency，Cutover 前要監控並等待 Target catch up。",
      "related": [
        "AWS DMS",
        "Full Load",
        "Cutover",
        "Replication Lag"
      ]
    },
    {
      "term": "Azure Container Apps",
      "fullName": "Azure Container Apps｜Azure 受管容器應用平台",
      "category": "Multi-cloud / Containers",
      "aliases": [
        "ACA",
        "Container Apps",
        "Azure 容器應用"
      ],
      "definition": "Azure 託管容器應用平台，支援 HTTP、TCP 及事件驅動擴縮，使用 Revision/Replica 管理應用版本與執行副本。",
      "example": "銀行行銷活動 API 使用 HTTP Scaling；背景處理服務使用事件觸發規則。",
      "confusion": "不是 AKS；Azure Container Apps 與 ECS、Cloud Run 的資源模型及部署機制不完全相同。",
      "related": [
        "ECS",
        "Cloud Run",
        "KEDA"
      ],
      "cloudCompare": {
        "aws": "ECS + Fargate",
        "azure": "ECS + Fargate（功能近似，非等價）",
        "gcp": "Cloud Run（功能近似，非等價）",
        "difference": "Azure Container Apps 具 Revision/Replica 與 HTTP/事件驅動擴縮；需比較入口、Scale Rules 與網路。",
        "scenario": "活動 API 依流量自動擴縮。"
      }
    },
    {
      "term": "Cloud Run",
      "fullName": "Google Cloud Run｜GCP 全代管容器運算",
      "category": "Multi-cloud / Containers",
      "aliases": [
        "GCP Cloud Run",
        "Cloud Run Services"
      ],
      "definition": "以受管方式執行容器化 HTTP 應用與工作負載，服務可依請求等負載調整執行個體，常見設定可縮至零。",
      "example": "平時幾乎沒有請求、活動期間流量激增的貸款試算 API。",
      "confusion": "Scale to Zero 可能帶來啟動延遲；Minimum Instances 有助降低冷啟動風險，但會增加成本。",
      "related": [
        "Azure Container Apps",
        "ECS",
        "Minimum Instances"
      ],
      "cloudCompare": {
        "aws": "ECS + Fargate",
        "azure": "ECS + Fargate（功能近似，非等價）",
        "gcp": "Cloud Run",
        "difference": "Cloud Run 以 Service/Revision/Instance 運行，支援 Scale to Zero；冷啟動與最小實例需權衡。",
        "scenario": "貸款試算活動平時低流量、活動時尖峰。"
      }
    },
    {
      "term": "Compensating Transaction",
      "fullName": "Compensating Transaction｜補償／補正交易",
      "category": "Banking / Data Consistency",
      "aliases": [
        "沖正",
        "補正交易",
        "補償交易"
      ],
      "definition": "以受控、可稽核的新交易抵銷或修正先前錯誤的業務效果，而非直接倒轉整個資料庫。",
      "example": "錯誤計息已正式入帳，依銀行授權流程產生沖正與正確計息補正紀錄，核對總分戶帳。",
      "confusion": "試算錯誤、入帳錯誤、對外清算後的錯誤處理方式不同；不能假設重跑交易就安全。",
      "related": [
        "Idempotency",
        "PITR",
        "Audit Trail"
      ]
    },
    {
      "term": "Idempotency",
      "fullName": "Idempotency｜冪等性",
      "category": "Banking / Data Consistency",
      "aliases": [
        "冪等",
        "防重複入帳"
      ],
      "definition": "相同請求重試多次時，不應產生重複的業務副作用。",
      "example": "放款交易重試使用唯一交易識別碼檢核，避免同筆交易重複入帳。",
      "confusion": "技術層 HTTP Retry 不等於業務交易可安全重跑；須有業務鍵、狀態及對帳機制。",
      "related": [
        "Compensating Transaction",
        "PITR"
      ]
    }
  ],
  "quizBank": [
    {
      "id": "A01",
      "category": "Architecture",
      "difficulty": "基礎",
      "question": "一個系統要求 99.99% Availability。下列哪個思考順序最像 Solutions Architect？",
      "options": [
        "先選最貴的 AWS 服務",
        "先確認 Requirement、Failure Mode、RTO/RPO，再設計架構",
        "先做 Multi-Region 再說",
        "只看 CPU 使用率"
      ],
      "answer": 1,
      "explanation": "SA 應先把需求、限制與故障模式定義清楚，再決定需要 Multi-AZ、Multi-Region 或其他設計。最強架構不等於最適合的架構。",
      "memory": "Requirement → Constraint → Failure Mode → Architecture → Trade-off。"
    },
    {
      "id": "A02",
      "category": "Architecture",
      "difficulty": "基礎",
      "question": "RDS Multi-AZ 最主要解決哪一個問題？",
      "options": [
        "Read Scaling",
        "Database High Availability / Failover",
        "Internet Routing",
        "Web Application Firewall"
      ],
      "answer": 1,
      "explanation": "RDS Multi-AZ 的核心目的是提高資料庫可用性與 Failover 能力；Read Replica 才主要用於讀取擴展。",
      "memory": "Multi-AZ = HA；Read Replica = Read Scaling。"
    },
    {
      "id": "N01",
      "category": "Networking",
      "difficulty": "基礎",
      "question": "Private Subnet 的 EC2 要主動下載 OS Patch，最典型的出口設計是？",
      "options": [
        "0.0.0.0/0 → Internet Gateway",
        "0.0.0.0/0 → NAT Gateway",
        "直接給 EC2 Public IP",
        "流量先經 RDS"
      ],
      "answer": 1,
      "explanation": "Private Subnet 通常把預設路由指向 NAT Gateway，讓內部資源主動連 Internet，同時避免 Internet 主動直接連入 EC2。",
      "memory": "Public → IGW；Private → NAT → IGW。"
    },
    {
      "id": "N02",
      "category": "Networking",
      "difficulty": "基礎",
      "question": "銀行客戶查詢貸款的主要 Request Path 中，哪個服務通常不在路徑上？",
      "options": [
        "WAF",
        "ALB",
        "NAT Gateway",
        "EC2"
      ],
      "answer": 2,
      "explanation": "NAT Gateway 主要處理 Private Resource 主動對外的 Internet Egress，不是 Internet 使用者進入 ALB 的主要 Request Path。",
      "memory": "NAT 是 Private Egress，不是 User Request Hop。"
    },
    {
      "id": "N03",
      "category": "Networking",
      "difficulty": "中等",
      "question": "Internet-facing ALB 放在 Public Subnet 的主要原因是？",
      "options": [
        "ALB 必須可以建立 EC2",
        "需要接收來自 Internet 的流量",
        "RDS 要經過 ALB",
        "Public Subnet 比 Private Subnet 便宜"
      ],
      "answer": 1,
      "explanation": "Internet-facing ALB 需要能透過 VPC 的 Internet connectivity 接收外部流量，因此部署於具有到 IGW 路由的 Public Subnet。",
      "memory": "Public/Private 先看 Route，而不是名字。"
    },
    {
      "id": "S01",
      "category": "Security",
      "difficulty": "基礎",
      "question": "Security Group 與 NACL 最關鍵的差異之一是？",
      "options": [
        "SG Stateless；NACL Stateful",
        "SG Stateful；NACL Stateless",
        "兩者都只能 Allow",
        "兩者都只能套在 EC2"
      ],
      "answer": 1,
      "explanation": "Security Group 是 Stateful 且只支援 Allow；NACL 是 Stateless，可設定 Allow / Deny，且作用於 Subnet 層級。",
      "memory": "SG = Resource + Stateful；NACL = Subnet + Stateless。"
    },
    {
      "id": "S02",
      "category": "Security",
      "difficulty": "基礎",
      "question": "想封鎖特定惡意 Web/API Request，第一個最該想到哪個 AWS Service？",
      "options": [
        "ALB",
        "AWS WAF",
        "NAT Gateway",
        "RDS Multi-AZ"
      ],
      "answer": 1,
      "explanation": "AWS WAF 用於 Web Request 規則，例如 IP、SQL Injection、XSS、Rate-based rules。ALB 負責分流，不是主要 Web Request Security Rule Engine。",
      "memory": "ALB 管流量；WAF 管 Web Request 安全。"
    },
    {
      "id": "S03",
      "category": "Security",
      "difficulty": "中等",
      "question": "APP-SG 最符合 Least Privilege 的 Inbound Source 是？",
      "options": [
        "0.0.0.0/0",
        "整個公司所有 Private CIDR",
        "ALB-SG",
        "RDS-SG"
      ],
      "answer": 2,
      "explanation": "如果只有 ALB 應該能連 Application，APP-SG 可直接引用 ALB-SG，範圍比整段 CIDR 更精準。",
      "memory": "能用 SG Reference，就不要隨便放大 CIDR。"
    },
    {
      "id": "I01",
      "category": "IAM",
      "difficulty": "基礎",
      "question": "EC2 要上傳報表到 S3，最佳做法通常是？",
      "options": [
        "把 Access Key 寫進 application.properties",
        "使用 EC2 IAM Role",
        "把 Access Key 存進 RDS",
        "建立永久 Admin User"
      ],
      "answer": 1,
      "explanation": "EC2 應使用 IAM Role 取得 Temporary Credentials，避免在程式或設定檔保存長期 Access Key。",
      "memory": "Role = 身分；Policy = 權限；Temporary Credentials = 短期憑證。"
    },
    {
      "id": "I02",
      "category": "IAM",
      "difficulty": "基礎",
      "question": "IAM Policy 中 Action 與 Resource 的關係，哪個正確？",
      "options": [
        "Action=對哪個資源；Resource=做什麼",
        "Action=做什麼；Resource=對哪個資源",
        "兩者都是身分",
        "兩者都代表 Network Route"
      ],
      "answer": 1,
      "explanation": "Action 是 API 操作，例如 s3:PutObject；Resource 是操作目標，例如特定 S3 Object ARN。",
      "memory": "Do What = Action；On What = Resource。"
    },
    {
      "id": "I03",
      "category": "IAM",
      "difficulty": "中等",
      "question": "哪一份 Policy 決定「誰可以 Assume 這個 IAM Role」？",
      "options": [
        "Trust Policy",
        "Permission Policy",
        "Security Group",
        "SCP 一定直接決定"
      ],
      "answer": 0,
      "explanation": "Role 的 Trust Policy 指定可信任 Principal；Permission Policy 則決定 Assume 成功後這個 Role 能做什麼。",
      "memory": "Trust = 誰能進；Permission = 進去後能做什麼。"
    },
    {
      "id": "I04",
      "category": "IAM",
      "difficulty": "中等",
      "question": "Arthur 有 sts:AssumeRole Permission，是否代表一定能 Assume 目標 Role？",
      "options": [
        "一定可以",
        "不一定，目標 Role 的 Trust Policy 也必須允許",
        "只要有 NAT 就可以",
        "只要有 AdministratorAccess 就一定可以"
      ],
      "answer": 1,
      "explanation": "Caller 有 sts:AssumeRole 只是其中一側；目標 Role 的 Trust Policy 也必須信任該 Principal，才能完成 AssumeRole。",
      "memory": "Caller 要有 AssumeRole 權；Role 也要 Trust 你。"
    },
    {
      "id": "I05",
      "category": "IAM",
      "difficulty": "中等",
      "question": "Role 有 AdministratorAccess，但 SCP Explicit Deny cloudtrail:StopLogging，結果會是？",
      "options": [
        "Allow，因為 AdministratorAccess 最大",
        "Deny，因為 Explicit Deny 優先",
        "要看 NAT Gateway",
        "改用 ALB 就能執行"
      ],
      "answer": 1,
      "explanation": "AWS 權限評估中 Explicit Deny 會覆蓋 Allow。SCP 是 Organization 層級 Guardrail，即使 Role 本身有 AdministratorAccess 仍可能被擋。",
      "memory": "Explicit Deny > Allow。"
    },
    {
      "id": "I06",
      "category": "IAM",
      "difficulty": "中等",
      "question": "SCP 最正確的描述是？",
      "options": [
        "直接授予 IAM User 權限",
        "Organization 層級的 Permission Guardrail",
        "用來驗證使用者密碼",
        "只控制 Network Traffic"
      ],
      "answer": 1,
      "explanation": "SCP 設定 Organization / OU / Account 的權限邊界或上限，不會直接把權限授予 User 或 Role。",
      "memory": "SCP 設上限，不發權限。"
    },
    {
      "id": "C01",
      "category": "Compute",
      "difficulty": "基礎",
      "question": "EC2-A 故障，ALB 最主要會做什麼？",
      "options": [
        "建立 EC2-C",
        "停止把流量送到不健康的 Target",
        "修改 Launch Template",
        "自動升級 RDS"
      ],
      "answer": 1,
      "explanation": "ALB 使用 Health Check 判斷 Target 健康狀況，並避免將流量送到 unhealthy Target。建立替代 Instance 是 ASG 的工作。",
      "memory": "ALB 停流量；ASG 補機。"
    },
    {
      "id": "C02",
      "category": "Compute",
      "difficulty": "基礎",
      "question": "ASG Desired=2、Actual=1，最可能發生什麼？",
      "options": [
        "ALB 建立新 EC2",
        "ASG 建立新 EC2 以回到 Desired Capacity",
        "NAT Gateway 增加容量",
        "RDS 建立 Read Replica"
      ],
      "answer": 1,
      "explanation": "ASG 會維持 Desired Capacity。如果 Actual 低於 Desired，會依 Launch Template 啟動新的 EC2。",
      "memory": "Desired = 當下想維持幾台。"
    },
    {
      "id": "C03",
      "category": "Compute",
      "difficulty": "基礎",
      "question": "Launch Template 最主要定義什麼？",
      "options": [
        "EC2 的建置規格",
        "ALB 的 WAF Rule",
        "RDS Backup Policy",
        "S3 Lifecycle"
      ],
      "answer": 0,
      "explanation": "Launch Template 可定義 AMI、Instance Type、Security Group、IAM Role、Storage、User Data 等 EC2 建置參數。",
      "memory": "Launch Template = EC2 Build Blueprint。"
    },
    {
      "id": "C04",
      "category": "Compute",
      "difficulty": "中等",
      "question": "兩台 EC2 都 Healthy，但 CPU 90% 且流量持續上升，新增 EC2 主要屬於？",
      "options": [
        "Replacement",
        "Scale Out",
        "Failover",
        "Backup"
      ],
      "answer": 1,
      "explanation": "Instance 沒有故障，只是 Capacity 不足，因此屬於 Scale Out；Replacement 是故障後補回 Desired Capacity。",
      "memory": "Replacement = 壞了補；Scale Out = 不夠用所以加。"
    },
    {
      "id": "C05",
      "category": "Compute",
      "difficulty": "中等",
      "question": "每天 09:00 都固定有登入尖峰，而 Application Warm-up 要 4 分鐘，較合理做法是？",
      "options": [
        "09:00 CPU 爆掉後才開始 Scale Out",
        "08:55 左右提前準備 Capacity",
        "把 Min 設成 0",
        "只增加 NAT Gateway"
      ],
      "answer": 1,
      "explanation": "已知固定尖峰且有 Warm-up 時間，應提前準備容量。Scheduled Scaling 很適合明確可預測的時間型態。",
      "memory": "可預測流量先準備；不可預測流量再反應。"
    },
    {
      "id": "C06",
      "category": "Compute",
      "difficulty": "中等",
      "question": "RequestCount 很高、Response Time 變慢，但 CPU 只有 35%。是否一定不需要 Scale Out？",
      "options": [
        "一定不需要",
        "不一定，CPU 可能不是最佳 Workload Metric",
        "一定要換 RDS",
        "一定是 WAF 問題"
      ],
      "answer": 1,
      "explanation": "Application 可能大量等待 I/O、DB 或下游 API，因此 CPU 不高也可能壓力很大。應選能代表 Workload Capacity 的 Metric，例如 ALBRequestCountPerTarget。",
      "memory": "Scaling Metric 要代表真正的 Workload。"
    },
    {
      "id": "ST01",
      "category": "Storage",
      "difficulty": "基礎",
      "question": "S3 Versioning 最主要可以幫忙處理哪一類問題？",
      "options": [
        "EC2 CPU 太高",
        "Object 被誤覆蓋或需要回復舊版本",
        "ALB 無法分流",
        "NAT Gateway 故障"
      ],
      "answer": 1,
      "explanation": "Versioning 會保存同一 Key 的多個 Version，可用於回復誤覆蓋或部分誤刪情況；但不等於完整 Backup Strategy。",
      "memory": "Versioning = 回歷史版本；Backup = 更完整 Recovery Strategy。"
    },
    {
      "id": "ST02",
      "category": "Storage",
      "difficulty": "基礎",
      "question": "Production EC2 的需求只有「上傳」Loan Report，Least Privilege 最適合的 Action 是？",
      "options": [
        "s3:*",
        "s3:GetObject + s3:PutObject",
        "s3:PutObject",
        "AdministratorAccess"
      ],
      "answer": 2,
      "explanation": "需求只有 Write，就只給 s3:PutObject。不要預先加入目前不存在的 Read 需求。",
      "memory": "需求只有 Write，就不要順手給 Read。"
    },
    {
      "id": "ST03",
      "category": "Storage",
      "difficulty": "中等",
      "question": "IAM Policy 要限制 S3 Object Resource，哪種寫法比較正確？",
      "options": [
        "s3://prod-loan-report/",
        "arn:aws:s3:::prod-loan-report/loan/*",
        "https://s3.amazonaws.com/prod-loan-report",
        "0.0.0.0/0"
      ],
      "answer": 1,
      "explanation": "IAM Resource 應使用 ARN。s3:// 是位置 URI，不是 IAM Policy Resource 的 ARN 表示法。",
      "memory": "S3 URI 是位置；IAM Resource 用 ARN。"
    },
    {
      "id": "ST04",
      "category": "Storage",
      "difficulty": "中等",
      "question": "CloudTrail 已啟用，是否代表所有 S3 GetObject / PutObject 一定都有被記錄？",
      "options": [
        "一定",
        "不一定，S3 Object 操作屬於 Data Events，需要另外啟用",
        "只有 NAT 存在時才記錄",
        "只有使用 SSE-KMS 才記錄"
      ],
      "answer": 1,
      "explanation": "S3 Object-level API 屬於 CloudTrail Data Events。若要完整做 Object Audit，需要明確設定 S3 Data Events。",
      "memory": "CloudTrail 有開 ≠ S3 Data Events 一定有開。"
    },
    {
      "id": "ST05",
      "category": "Storage",
      "difficulty": "中等",
      "question": "銀行要求 S3 稽核資料 7 年內連 Root User 都不能提前永久刪除，最適合哪個設計？",
      "options": [
        "只開 Versioning",
        "Object Lock Governance Mode",
        "Object Lock Compliance Mode",
        "只放 Glacier Deep Archive"
      ],
      "answer": 2,
      "explanation": "Compliance Mode 在 Retention 期間內提供更嚴格的不可變更保護，Retention 不能被縮短；Versioning 或 Glacier 本身不等同這種 WORM 保護。",
      "memory": "Root 也不能提前永久刪除 → 想到 Compliance Mode。"
    },
    {
      "id": "DR01",
      "category": "Architecture",
      "difficulty": "基礎",
      "question": "業務要求「最多損失 5 分鐘資料，30 分鐘內恢復服務」，哪個對應正確？",
      "options": [
        "RTO=5、RPO=30",
        "RPO=5、RTO=30",
        "Retention=5、RTO=30",
        "RPO=30、Retention=5"
      ],
      "answer": 1,
      "explanation": "RPO 是可接受的資料損失時間窗口；RTO 是中斷後恢復服務的目標時間。",
      "memory": "RPO 看 Data；RTO 看 Time to Service Recovery。"
    },
    {
      "id": "DR02",
      "category": "Storage",
      "difficulty": "中等",
      "question": "Region A 的 S3 要持續建立 Region B 副本，最直接的機制是？",
      "options": [
        "S3 Lifecycle",
        "S3 Cross-Region Replication",
        "RDS Multi-AZ",
        "NAT Gateway"
      ],
      "answer": 1,
      "explanation": "Cross-Region Replication（CRR）用於跨 Region 非同步複寫 S3 Object。",
      "memory": "CRR = Cross-Region、Asynchronous Replication。"
    },
    {
      "id": "DR03",
      "category": "Storage",
      "difficulty": "進階",
      "question": "Business RPO 要求 ≤10 分鐘，而 S3 RTC 提供 15 分鐘等級的 Replication SLA。SA 應如何描述？",
      "options": [
        "直接宣稱達標",
        "把 Business RPO 改成 15 分鐘",
        "不能直接宣稱達標，需重新評估資料保護方案",
        "關閉 Versioning"
      ],
      "answer": 2,
      "explanation": "Business RPO 是需求，不能由服務規格反向修改。若技術 SLA 無法證明滿足 RPO，就必須重新評估整體寫入、複寫與復原設計。",
      "memory": "Service SLA ≠ Business RPO。"
    },
    {
      "id": "DB01",
      "category": "Database",
      "difficulty": "基礎",
      "question": "RDS Primary / AZ 故障，但 Read Load 不高，最優先要解的是？",
      "options": [
        "Read Replica",
        "Multi-AZ DB instance deployment",
        "S3 Versioning",
        "NAT Gateway"
      ],
      "answer": 1,
      "explanation": "這是 Availability / Failover 問題，傳統 Multi-AZ DB instance 的 Primary + Standby 正是用來降低 DB/AZ 故障造成的中斷。",
      "memory": "機器壞 → Multi-AZ。"
    },
    {
      "id": "DB02",
      "category": "Database",
      "difficulty": "中等",
      "question": "月底 BI 報表 SELECT 很多，Primary Write 正常但 Read 壓力高，較合適的設計是？",
      "options": [
        "把所有 Write 送 Read Replica",
        "新增 Read Replica 並把適合的 Read 導過去",
        "只做 Multi-AZ Standby",
        "關閉 Automated Backup"
      ],
      "answer": 1,
      "explanation": "Read Replica 用來承接 Read-heavy Workload。一般 RDS Read Replica 使用非同步複寫，因此需留意 Replica Lag。",
      "memory": "讀太多 → Read Replica。"
    },
    {
      "id": "DB03",
      "category": "Database",
      "difficulty": "中等",
      "question": "DBA 誤 DELETE 大量 Production 資料，Multi-AZ Standby 能直接救回刪除前資料嗎？",
      "options": [
        "可以，直接 Failover",
        "不行，錯誤通常也會同步；應使用 Backup / PITR",
        "可以，只要有 Read Replica",
        "只要 ALB Health Check 通過即可"
      ],
      "answer": 1,
      "explanation": "Multi-AZ 處理基礎設施故障，不是 Logical Error。錯誤 DELETE 會被資料庫複寫機制帶到另一側；需要 PITR 還原到事故前。",
      "memory": "HA ≠ Backup；資料搞壞 → PITR。"
    },
    {
      "id": "DB04",
      "category": "Database",
      "difficulty": "進階",
      "question": "Reporting Read Flow 最精準的畫法是哪個？",
      "options": [
        "Report → Primary → Read Replica",
        "Report / BI → Read Replica endpoint；Primary → Replica 另畫非同步複寫",
        "Report → Standby",
        "Report → NAT → RDS"
      ],
      "answer": 1,
      "explanation": "Application 的 Read Request 應直接連對應的 Replica endpoint。Primary → Replica 是資料複寫路徑，不是使用者 Request 的必經 Hop。",
      "memory": "Request Path 與 Replication Path 要分開畫。"
    },
    {
      "id": "AR01",
      "category": "Database",
      "difficulty": "基礎",
      "question": "Aurora 的 INSERT / UPDATE / DELETE 通常應該連哪個 Endpoint？",
      "options": [
        "Reader Endpoint",
        "Writer / Cluster Endpoint",
        "Instance Endpoint of any reader",
        "NAT Gateway"
      ],
      "answer": 1,
      "explanation": "Writer / Cluster Endpoint 指向目前 Writer，是 Aurora Cluster 的主要 Read/Write 入口。",
      "memory": "Write → Writer Endpoint。"
    },
    {
      "id": "AR02",
      "category": "Database",
      "difficulty": "中等",
      "question": "Aurora Reader Endpoint 最精準的描述是？",
      "options": [
        "每條 SQL 都 Round Robin",
        "對 Read-only connections 做 balancing",
        "只在 Writer 故障時使用",
        "跨 Region replication endpoint"
      ],
      "answer": 1,
      "explanation": "Reader Endpoint 對 Aurora Replicas 做 Connection Balancing，不是每一條 Query 都重新分配。",
      "memory": "Reader Endpoint 平衡 Connection，不是 Query。"
    },
    {
      "id": "AR03",
      "category": "Database",
      "difficulty": "中等",
      "question": "整個 Primary AWS Region 無法使用時，哪個設計最直接對應 Region-level DR？",
      "options": [
        "同 Region Multi-AZ",
        "Aurora Global Database",
        "只增加 Reader Endpoint",
        "S3 Lifecycle"
      ],
      "answer": 1,
      "explanation": "Multi-AZ 處理同 Region 的 AZ / Instance failure；Region-level disaster 需要 Multi-Region DR，例如 Aurora Global Database。",
      "memory": "Multi-AZ ≠ Multi-Region。"
    },
    {
      "id": "AR04",
      "category": "Database",
      "difficulty": "進階",
      "question": "Aurora Global Database 的 Business RPO 要求 5 分鐘，SA 最應該做什麼？",
      "options": [
        "看到 Global Database 就直接宣稱 RPO=0",
        "監控 Secondary replication / RPO lag，並以 DR 演練驗證是否滿足 5 分鐘目標",
        "只確認 Reader Endpoint 正常",
        "把 Requirement 改成服務目前的 lag"
      ],
      "answer": 1,
      "explanation": "RPO 是 Business Requirement。Global Database 跨 Region replication 是非同步，應監控 lag 並透過 DR 測試驗證目標。",
      "memory": "Business RPO 要驗證，不能由 Service 名稱保證。"
    },
    {
      "id": "DR04",
      "category": "Database",
      "difficulty": "基礎",
      "question": "DBA 誤刪大量交易資料，Multi-AZ Failover 能直接回到誤刪前嗎？",
      "options": [
        "可以",
        "不行；應使用 Backup / PITR",
        "只要 Reader Endpoint 正常就可以",
        "只要切到另一個 AZ"
      ],
      "answer": 1,
      "explanation": "Multi-AZ 解 Infrastructure Failure，Logical DELETE 通常也會被複寫；誤刪需要 Backup / PITR。",
      "memory": "HA ≠ Backup。"
    },
    {
      "id": "DR05",
      "category": "Database",
      "difficulty": "中等",
      "question": "Migration 前想保留一個明確、可長期保存的變更前 Recovery Point，最直接的是？",
      "options": [
        "Manual Snapshot",
        "Multi-AZ",
        "Read Replica",
        "NAT Gateway"
      ],
      "answer": 0,
      "explanation": "Manual Snapshot 是使用者主動建立的特定時間點完整快照，適合 Pre-change / Pre-migration checkpoint。",
      "memory": "Manual Snapshot = 明確 Checkpoint。"
    },
    {
      "id": "DR06",
      "category": "Architecture",
      "difficulty": "中等",
      "question": "核心系統 RTO 15 分鐘，而歷史報表 RTO 8 小時，哪種配對較合理？",
      "options": [
        "兩者都只用 Cross-Region Backup",
        "核心系統優先考慮 Aurora Global Database；報表可評估 Cross-Region Backup",
        "兩者都只做 Multi-AZ",
        "兩者都不需要 DR"
      ],
      "answer": 1,
      "explanation": "較嚴格的 RTO 通常需要更多預先準備的 DR 資源；寬鬆 RTO 可以用災難後 Restore 的較低成本模式。",
      "memory": "RTO 越短，通常預先準備越多。"
    },
    {
      "id": "DR07",
      "category": "Architecture",
      "difficulty": "進階",
      "question": "RTO=30 分鐘的 DR Test，最正確的驗證終點是？",
      "options": [
        "30 分鐘內切回原本故障 Region",
        "30 分鐘內在可用 DR Region 恢復完整服務並完成健康與交易驗證",
        "30 分鐘內建立一個 Snapshot",
        "30 分鐘內確認 Backup 存在"
      ],
      "answer": 1,
      "explanation": "RTO 衡量從事故到 Service 恢復的時間。Failback 回原 Region 是後續流程，不是 RTO 的必要終點。",
      "memory": "RTO = Restore Service；Failback 是之後的事。"
    },
    {
      "id": "DR08",
      "category": "Architecture",
      "difficulty": "基礎",
      "question": "DR Region 有 Aurora Secondary、Secrets 與設定，但沒有 Running Application Compute。這最接近哪種 DR Strategy？",
      "options": [
        "Backup & Restore",
        "Pilot Light",
        "Warm Standby",
        "Active/Active"
      ],
      "answer": 1,
      "explanation": "Pilot Light 保留資料與核心資源，但完整 Application 尚不能立即服務。",
      "memory": "Pilot Light = Core/Data on；App 未必 Running。"
    },
    {
      "id": "DR09",
      "category": "Architecture",
      "difficulty": "中等",
      "question": "Pilot Light 和 Warm Standby 最重要的差異是？",
      "options": [
        "是否有 Backup",
        "是否跨 AZ",
        "DR Region 是否已有完整可運行的縮小版 Application",
        "是否使用 IAM"
      ],
      "answer": 2,
      "explanation": "Warm Standby 的完整 workload 已 Running；Pilot Light 還需要建立/啟動部分應用資源才能服務。",
      "memory": "Warm Standby = App 已活著。"
    },
    {
      "id": "DR10",
      "category": "Networking",
      "difficulty": "中等",
      "question": "東京與大阪各有一個 ALB，若要在 Region Failover 時把同一網域流量切到大阪，哪個元件最直接對應？",
      "options": [
        "只有 ALB",
        "Route 53 Failover Routing / Global Routing",
        "NACL",
        "NAT Gateway"
      ],
      "answer": 1,
      "explanation": "ALB 是 Regional Load Balancer；跨 Region 的 client traffic routing 需要 Route 53、Global Accelerator 或 ARC 等全域流量機制。",
      "memory": "ALB 管 Region 內；Global Routing 管 Region 間。"
    },
    {
      "id": "DR11",
      "category": "Architecture",
      "difficulty": "進階",
      "question": "Active/Active 兩個 Region 都允許修改同一 Account Balance 時，最重要的額外設計議題是？",
      "options": [
        "只要 EC2 數量夠",
        "Data consistency、concurrent write conflict、ordering / transaction semantics",
        "只要 Route 53 TTL 很低",
        "只要使用 Multi-AZ"
      ],
      "answer": 1,
      "explanation": "Multi-Region multi-writer 會涉及一致性、同筆資料競爭寫入、衝突處理與交易順序等問題。",
      "memory": "Active/Active 最難的常常不是 Compute，而是 Data。"
    },
    {
      "id": "MG01",
      "category": "Migration",
      "difficulty": "基礎",
      "question": "Data Center 6 個月內關閉、Legacy App 沒時間大量改程式，第一階段只求安全搬上 AWS，最合理的 7R 是？",
      "options": [
        "Refactor",
        "Rehost",
        "Retire",
        "Repurchase"
      ],
      "answer": 1,
      "explanation": "期限短且變更風險高時，Rehost 可先降低 Migration complexity，再於後續階段 Modernize。",
      "memory": "Rehost = 搬，不太改。"
    },
    {
      "id": "MG02",
      "category": "Migration",
      "difficulty": "中等",
      "question": "Oracle on VM 搬到 Amazon RDS，Application 只有少量調整，較接近哪個 Strategy？",
      "options": [
        "Rehost",
        "Replatform",
        "Retain",
        "Retire"
      ],
      "answer": 1,
      "explanation": "從 self-managed database 改用 managed database 是典型有限度平台最佳化，因此偏 Replatform。",
      "memory": "Replatform = 搬 + 平台最佳化。"
    },
    {
      "id": "MG03",
      "category": "Migration",
      "difficulty": "中等",
      "question": "AWS DMS Full Load + CDC 的核心用途是？",
      "options": [
        "保證零延遲",
        "先搬既有資料並持續同步來源變更，以降低 cutover downtime / data gap",
        "自動把 Monolith 拆成 microservices",
        "取代 Route 53"
      ],
      "answer": 1,
      "explanation": "Full Load 遷移既有資料；CDC 捕捉 ongoing changes。但 CDC latency 並非 0。",
      "memory": "Full Load + CDC = Existing Data + Ongoing Changes。"
    },
    {
      "id": "MG04",
      "category": "Migration",
      "difficulty": "進階",
      "question": "DMS CDC 已 Running，Cutover 前最重要的動作順序何者較合理？",
      "options": [
        "Switch App → Stop Writes → Validate",
        "Stop/Control Writes → Wait CDC Catch-up → Validate → Switch App → Smoke Test → Open Traffic",
        "Open Traffic → Validate → Stop Writes",
        "只要 CDC Running 就直接切換"
      ],
      "answer": 1,
      "explanation": "先控制來源寫入並等待 CDC catch up，確認 Target data 後再切 Application，做 smoke test 後才開正式流量。",
      "memory": "Cutover 要先收斂資料，再切 Application。"
    },
    {
      "id": "D22-Q1",
      "category": "Multi-cloud / Containers",
      "difficulty": "中等",
      "question": "銀行 Loan API 已在 AWS，使用 RDS 與 CloudWatch，需全天候運行、無 K8s 經驗且希望減少 EC2 管理，應優先評估哪個平台？",
      "options": [
        "EKS，因為所有容器必須使用 Kubernetes",
        "ECS + Fargate，搭配 ALB、Auto Scaling 與高可用設計",
        "Cloud Run，一定比 AWS 便宜且延遲更低",
        "單一 EC2 Docker，無需容器編排"
      ],
      "answer": 1,
      "explanation": "AWS 現有整合、無 Kubernetes 維運需求、需要持續服務及管理 Tasks，ECS + Fargate 是合理第一優先。",
      "memory": "選型依需求、既有平台、團隊能力與運維成本；不是一律選 K8s。"
    },
    {
      "id": "D22-Q2",
      "category": "Multi-cloud / Containers",
      "difficulty": "中等",
      "question": "關於 AWS ECS、Azure Container Apps、GCP Cloud Run，哪些敘述正確？（複選）",
      "options": [
        "A ECS Task Definition 描述執行規格；Service 維持 Tasks",
        "B Azure Container Apps 支援 HTTP 或事件來源擴縮，需正確配置 Scale Rules",
        "C Cloud Run 可能縮至零；延遲敏感服務評估 Minimum Instances 與成本",
        "D 三者部署機制完全一致可直接複製",
        "E Application Rollback 自動修復錯誤放款交易",
        "F Auto Scaling 仍須評估 DB 連線與容量"
      ],
      "answer": [
        0,
        1,
        2,
        5
      ],
      "explanation": "A、B、C、F 正確。容器服務功能有交集但不等價；Rollback 不會自動修復已產生的交易結果。",
      "memory": "Azure Container Apps：Scale Rules；Cloud Run：Scale to Zero / Minimum Instances；DB 是擴縮瓶頸之一。"
    },
    {
      "id": "D22-Q3",
      "category": "Multi-cloud / Containers",
      "difficulty": "中等",
      "question": "下列哪個 ECS 元件用來定義 Image、CPU、Memory、Port？",
      "options": [
        "Cluster",
        "Task Definition",
        "Service",
        "ALB"
      ],
      "answer": 1,
      "explanation": "Task Definition 是容器執行規格；Service 負責維持 Task 數量，Cluster 是邏輯分組。",
      "memory": "Task Definition = 規格；Task = 實例；Service = 持續維持；Cluster = 分組。"
    },
    {
      "id": "D22-Q4",
      "category": "Banking / Data Recovery",
      "difficulty": "進階",
      "question": "部分放款利息計算錯誤，但其他正式交易正常，應如何修復？",
      "options": [
        "直接 PITR 回到事故前，再全部重跑",
        "僅擴大 ECS Tasks",
        "隔離受影響交易、確認影響範圍，受控回復應用，透過審核的補正/沖正/重算程序修正並對帳",
        "因 ECS Healthy 不需處理"
      ],
      "answer": 2,
      "explanation": "整庫 PITR 可能連正常交易一起倒退，造成資料遺失或重複入帳。應保留流水、冪等性、稽核軌跡並按銀行作業規範修正。",
      "memory": "Application Rollback ≠ DB Restore ≠ Business Data Repair；PITR 不是少量業務錯帳的預設解法。"
    }
  ],
  "days": [
    {
      "day": 1,
      "date": "2026-09-16",
      "topic": "High Availability / RDS",
      "score": 72,
      "status": "completed",
      "mastered": [
        "Multi-Region 先看 RTO / RPO / Business Criticality / Cost",
        "ALB、ASG、RDS Multi-AZ 的基本角色"
      ],
      "corrections": [
        [
          "不能只回答「用 RDS」",
          "先說原架構風險：MySQL on EC2 需要自行維護 DB OS、Patch、Backup、HA，才導出 RDS。"
        ],
        [
          "RDS → DB 的畫法不精準",
          "RDS 本身就是託管式 Database Service；Application 通常連 RDS Endpoint。"
        ],
        [
          "ALB 不負責補機",
          "ALB 管流量與 Health Check；Auto Scaling Group 管 EC2 數量與生命週期。"
        ],
        [
          "Multi-AZ Standby 不是一般讀取節點",
          "RDS Multi-AZ 主要解決 HA / Failover；Read Replica 才偏向 Read Scaling。"
        ]
      ],
      "memory": [
        "ALB 管流量；ASG 管機器。",
        "Multi-AZ = HA；Read Replica = Read Scaling。",
        "每放一個 AWS Service，都要能回答：它解決哪個 Requirement / Failure？"
      ],
      "archive": "docs/cloud-sa-day01-2026-09-16.md"
    },
    {
      "day": 2,
      "date": "2026-09-17",
      "topic": "VPC / Public-Private / NAT",
      "score": 84,
      "status": "completed",
      "mastered": [
        "Public Subnet 0.0.0.0/0 → IGW",
        "Private Subnet 0.0.0.0/0 → NAT Gateway",
        "NAT 是 Private Egress，不在主 Request Path"
      ],
      "corrections": [
        [
          "Internet-facing ALB 為何放 Public",
          "因為需要接收 Internet Traffic；不是因為「需要雙向」。ALB 也可以是 Internal。"
        ],
        [
          "RDS Private 的理由",
          "重點是縮小 DB 暴露面，App → RDS 走 Private Network，不需要經 NAT。"
        ],
        [
          "Request Path 漏 IGW",
          "Internet-facing 架構應理解 Internet → IGW → ALB → Private EC2 → Private RDS。"
        ]
      ],
      "memory": [
        "IGW = VPC 與 Internet 的 Gateway。",
        "NAT Gateway = 讓 Private Subnet 主動存取 Internet。",
        "Public 直接走 IGW；Private 先走 NAT。"
      ],
      "archive": "docs/cloud-sa-day02-2026-09-17.md"
    },
    {
      "day": 3,
      "date": "2026-09-18",
      "topic": "Security Group / NACL / WAF",
      "score": 88,
      "status": "completed",
      "mastered": [
        "SG = Stateful + Allow Only",
        "NACL = Stateless + Allow / Deny",
        "ALB 管流量；WAF 管 Web Request 規則"
      ],
      "corrections": [
        [
          "EC2 / RDS 只寫內網 CIDR",
          "更符合 Least Privilege 的做法：EC2 SG Source = ALB-SG；RDS SG Source = APP-SG。"
        ],
        [
          "Web/API 惡意流量想到 ALB",
          "應想到 AWS WAF；ALB 是 L7 Load Balancing / Routing，不是 Web 安全規則引擎。"
        ]
      ],
      "memory": [
        "SG-to-SG 比整段 CIDR 更符合 Least Privilege。",
        "SG = Resource Level；NACL = Subnet Level。"
      ],
      "archive": "docs/cloud-sa-day03-2026-09-18.md"
    },
    {
      "day": 4,
      "date": "2026-09-20",
      "topic": "IAM / Role / Policy / Least Privilege",
      "score": 87,
      "status": "completed",
      "mastered": [
        "EC2 優先使用 IAM Role，不把長期 Access Key 寫進程式",
        "Least Privilege：需求只有 Write 就不要順手給 Read"
      ],
      "corrections": [
        [
          "Role 只是在「認身分」",
          "Role 是可被 Assume 的 AWS Identity；Policy 定義可做什麼；實際 API 呼叫使用 Temporary Credentials。"
        ],
        [
          "Action / Resource 混淆",
          "Action = 做什麼；Resource = 對哪個 AWS Resource 做。"
        ],
        [
          "IAM Role 畫進 Network Path",
          "IAM 是 Authorization，不是封包必經的 Network Hop。"
        ]
      ],
      "memory": [
        "Role = 身分；Policy = 權限；Temporary Credentials = 短期憑證。",
        "IAM 決定可不可以做；Network 決定封包怎麼走。"
      ],
      "archive": "docs/cloud-sa-day04-2026-09-20.md"
    },
    {
      "day": 5,
      "date": "2026-09-22",
      "topic": "AssumeRole / Trust Policy",
      "score": 81,
      "status": "completed",
      "mastered": [
        "Incident Responder 應使用受控 AssumeRole + MFA + CloudTrail",
        "永久高權限 ≠ 維運方便"
      ],
      "corrections": [
        [
          "sts:AssumeRole 不是 Trust Policy",
          "sts:AssumeRole 是 Action。"
        ],
        [
          "有 EC2 Read Permission 不代表能 Assume Role",
          "Trust Policy 管誰能 Assume；Permission Policy 管 Assume 後能做什麼。"
        ],
        [
          "Role / Resource / Action 混用",
          "ProductionReadOnlyRole 是 Role；s3:GetObject 是 Action；Bucket/Object ARN 是 Resource。"
        ]
      ],
      "memory": [
        "Caller 要有 AssumeRole 權；目標 Role 也要 Trust 你。",
        "Trust = 誰能進；Permission = 進去後能做什麼。"
      ],
      "archive": "docs/cloud-sa-day05-2026-09-22.md"
    },
    {
      "day": 6,
      "date": "2026-09-23",
      "topic": "Explicit Deny / SCP / AccessDenied",
      "score": 83,
      "status": "completed",
      "mastered": [
        "Explicit Deny > Allow",
        "AccessDenied 要看整條 Effective Permissions，而不是只看 Role Policy"
      ],
      "corrections": [
        [
          "SCP 說成身分驗證",
          "SCP 是 Organization 層級 Authorization Guardrail，不是 Authentication。"
        ],
        [
          "AdministratorAccess 為何仍被擋",
          "真正原因是 SCP Explicit Deny 覆蓋 Allow。"
        ],
        [
          "已知 Role 有 s3:* 還再懷疑 Role 沒權限",
          "應改查 SCP、Bucket Policy、Permissions Boundary、Session Policy、KMS 等。"
        ]
      ],
      "memory": [
        "Authentication = 你是誰。",
        "Authorization = 你能做什麼。",
        "SCP 設上限，不直接授權。"
      ],
      "archive": "docs/cloud-sa-day06-2026-09-23.md"
    },
    {
      "day": 7,
      "date": "2026-09-23",
      "topic": "EC2 Auto Scaling / Launch Template",
      "score": 86,
      "status": "completed",
      "mastered": [
        "ALB / ASG / Launch Template 分工",
        "ALB 停流量；ASG 補機"
      ],
      "corrections": [
        [
          "App Tier 題目回答到 DB / Single-AZ",
          "先定位討論 Layer，再做 Trade-off。"
        ],
        [
          "99.99% Availability 下夜間 Min=1",
          "ASG 能補機不等於零中斷；Production 通常要在 Failure 前保留跨 AZ 冗餘。"
        ],
        [
          "上雲都是按流量計價",
          "EC2 Compute 主要依 Instance 運行 / 容量計費；沒流量但 Instance 在跑仍可能產生成本。"
        ]
      ],
      "memory": [
        "ALB = 流量 + Health Check。",
        "ASG = Capacity + Replacement + Scale In / Out。",
        "Launch Template = EC2 Build Blueprint。"
      ],
      "archive": "docs/cloud-sa-day07-2026-09-23.md"
    },
    {
      "day": 8,
      "date": "2026-09-24",
      "topic": "Scaling Metric / Warm-up / Scheduled Scaling",
      "score": 94,
      "status": "completed",
      "mastered": [
        "Replacement vs Scaling",
        "RequestCountPerTarget 不一定比 CPU 差",
        "Scale Out ≠ 新 Capacity 立刻可用"
      ],
      "corrections": [
        [
          "Desired = 2~3",
          "Desired Capacity 在某一時間點是一個明確數字；Min / Max 才是上下限。"
        ],
        [
          "CPU + RequestCount 當一條 OR Target Tracking",
          "較精準的理解是不同 Metric 建不同 Target Tracking Policy。"
        ],
        [
          "固定 09:00 尖峰只等 CPU 超標",
          "可預測流量應提前準備 Capacity；固定時點可用 Scheduled Scaling。"
        ]
      ],
      "memory": [
        "Replacement = 壞一台補一台。",
        "Scale Out = 負載高，提高 Desired。",
        "Warm-up = 新 Instance 出現不代表已可穩定服務。",
        "可預測流量先準備；不可預測流量再反應。"
      ],
      "archive": "docs/cloud-sa-day08-2026-09-24.md"
    },
    {
      "day": 9,
      "date": "2026-09-26",
      "topic": "S3 / Lifecycle / IAM / Audit",
      "score": 92,
      "status": "completed",
      "mastered": [
        "Versioning ≠ Backup",
        "Lifecycle = 自動管理資料生命週期",
        "Archive 不能只看每 GB 最低價格",
        "SSE-KMS / CloudTrail 的金融情境思維"
      ],
      "corrections": [
        [
          "只能上傳卻給 s3:GetObject",
          "如果 Requirement 只有上傳，先只給 s3:PutObject。"
        ],
        [
          "IAM Resource 寫成 s3:// URI",
          "IAM Policy Resource 應使用 ARN，例如 arn:aws:s3:::prod-loan-report/loan/*。"
        ],
        [
          "90 天～1 年只寫 Storage Class",
          "要依 Access Frequency / Retrieval SLA 指定，例如 Standard-IA 或 Intelligent-Tiering。"
        ],
        [
          "CloudTrail 有開就一定有 S3 Object Audit",
          "S3 Object Put/Get/Delete 屬於 Data Events，需要明確啟用 S3 Data Events。"
        ]
      ],
      "memory": [
        "Versioning = 回復歷史版本。",
        "Lifecycle = 自動轉換 Storage Tier。",
        "S3 IAM Resource = ARN，不是 s3:// URI。",
        "CloudTrail 有開 ≠ S3 Data Events 一定有開。"
      ],
      "archive": "docs/cloud-sa-day09-2026-09-26.md"
    },
    {
      "day": 10,
      "date": "2026-09-29",
      "topic": "S3 Object Lock / Replication / RTO-RPO",
      "score": 91,
      "status": "completed",
      "mastered": [
        "RTO = 恢復服務時間；RPO = 可接受資料損失時間",
        "Object Lock Compliance Mode 適合高強度不可變更需求",
        "S3 CRR 是跨 Region 非同步複寫",
        "Replication 不等於完整 Backup"
      ],
      "corrections": [
        [
          "Replication 只寫 asynchronous replication",
          "機制名稱應明確寫 S3 Cross-Region Replication（CRR）；Asynchronous 是其運作方式。"
        ],
        [
          "RPO 10 分鐘直接搭 S3 RTC",
          "S3 RTC 的技術 SLA 不能直接證明 Business RPO ≤ 10 分鐘；若需求更嚴格需重新評估資料保護架構。"
        ],
        [
          "Audit 只寫 CloudTrail",
          "若要追 S3 GetObject / PutObject / DeleteObject 等 Object 操作，要明確啟用 CloudTrail S3 Data Events。"
        ],
        [
          "Object Lock 說成誰都不能動",
          "更精準：Retention 期間受保護 Object Version 不能被永久刪除，Compliance Mode 的 Retention 不能被縮短；仍可讀取與建立新 Version。"
        ]
      ],
      "memory": [
        "Retention = 要留多久；Object Lock = 這段期間能不能刪。",
        "RPO = 可以掉多少資料；RTO = 可以停多久。",
        "CRR = 跨 Region 非同步複寫。",
        "RTC 的技術 SLA ≠ 自動滿足更嚴格的 Business RPO。"
      ],
      "archive": "docs/cloud-sa-day10-2026-09-29.md"
    },
    {
      "day": 11,
      "date": "2026-09-29",
      "topic": "RDS Multi-AZ / Read Replica / Backup-PITR",
      "score": 86,
      "status": "completed",
      "mastered": [
        "Multi-AZ 主要解決 DB / AZ Failure 與 Failover",
        "Read Replica 用於 Read Scaling，且需注意非同步 Replica Lag",
        "Automated Backup + PITR 可建立事故前時間點的新 DB",
        "Write 與 Reporting Read 應依一致性需求分流"
      ],
      "corrections": [
        [
          "誤刪資料後認為 Failover 到 Standby 能救",
          "不能。Multi-AZ 解 Infrastructure Failure；Logical DELETE 通常也會同步到 Standby。這種情況應使用 PITR 還原到事故前。"
        ],
        [
          "High Availability 寫成 Multi-AZ DB instance(Standby,cluster)",
          "DB instance deployment 與 Multi-AZ DB cluster 是兩種不同架構，文件中應明確選一種，不要混寫。"
        ],
        [
          "Reporting Read Flow 畫成 Primary → Read Replica",
          "Request 應由 Application / Reporting Service 直接連 Read Replica endpoint；Primary → Replica 是非同步資料複寫路徑。"
        ],
        [
          "PITR 只寫 Recovery DB",
          "應明確描述：從 Automated Backup / Log 還原到事故前時間點，建立新的 DB Instance，再驗證與切換流量。"
        ]
      ],
      "memory": [
        "機器壞 → Multi-AZ。",
        "讀太多 → Read Replica。",
        "資料搞壞 → Backup / PITR。",
        "Request Path 與 Replication Path 要分開畫。",
        "HA ≠ Backup。"
      ],
      "archive": "docs/cloud-sa-day11-2026-09-29.md"
    },
    {
      "day": 12,
      "date": "2026-09-30",
      "topic": "Amazon Aurora / Endpoints / Global Database",
      "score": 88,
      "status": "completed",
      "mastered": [
        "Writer Endpoint 用於交易寫入，Reader Endpoint 用於 Read-only connection balancing",
        "Aurora Writer / Readers 共用 Cluster Storage",
        "Aurora Replica 同時可做 Read Scaling 與 Failover Target",
        "Aurora Global Database 用於跨 Region DR，Cross-Region replication 為非同步"
      ],
      "corrections": [
        [
          "Region 故障仍回答 Multi-AZ HA",
          "Multi-AZ 只涵蓋單一 Region 內的 AZ / Instance failure；整個 Primary Region 無法使用時應評估 Aurora Global Database 與 Cross-Region failover。"
        ],
        [
          "Writer 寫成 Primary Region",
          "Primary Region 是地理角色；真正的 Writer 是 Primary Aurora Cluster 內的 Writer DB instance。"
        ],
        [
          "RPO 5 分鐘只重述『最多掉 5 分鐘資料』",
          "還要驗證 Secondary Region 的 cross-Region replication lag 是否持續低於需求，建立 CloudWatch alarm 並用 DR 演練驗證。"
        ],
        [
          "RTO 30 分鐘只想到 Application 啟動與流量切換",
          "還要納入 DNS / Global Writer Endpoint、Networking、Secrets / IAM、Cluster configuration、Application health check、Runbook 與復原驗證。"
        ],
        [
          "Writer 故障題沒有直接回答是否要手動改 hostname",
          "正確答案是不應手動綁死 Instance hostname；Application 應透過 Writer / Cluster Endpoint 重新連線到新的 Writer。"
        ]
      ],
      "memory": [
        "Writer Endpoint = Read / Write role entry point。",
        "Reader Endpoint = Read connection balancing。",
        "Aurora Replica = Read Scaling + Failover Target。",
        "Single-Region HA ≠ Multi-Region DR。",
        "Business RPO 要用 replication lag + DR test 驗證。"
      ],
      "archive": "docs/cloud-sa-day12-2026-09-30.md"
    },
    {
      "day": 13,
      "date": "2026-10-01",
      "topic": "Database DR / Backup Strategy",
      "score": 82,
      "status": "completed",
      "mastered": [
        "DBA 誤刪應使用 Automated Backup + PITR，而不是 Multi-AZ Failover",
        "Manual Snapshot 適合作為 Migration / Schema Change 前的明確 Recovery Point",
        "Aurora Global Database 偏低 RTO；Cross-Region Backup 成本較低但 Restore 時間較長",
        "RPO 要以實際資料落後量驗證，而不是只背定義"
      ],
      "corrections": [
        [
          "System A / B 沒明確寫出方案名稱",
          "System A（RTO 15 min / RPO 1 min）應明確答 Aurora Global Database；System B（RTO 8 hr / RPO 24 hr）可評估 Cross-Region Backup + Disaster-time Restore。"
        ],
        [
          "Region DR 欄位留白",
          "若採本題較嚴格的 RTO 30 min，較合理的是 Aurora Global Database；若成本優先且能接受更長 Restore，才偏 Cross-Region Backup。"
        ],
        [
          "RTO 30 分鐘寫成『30 分鐘後切回原本 Region』",
          "RTO 的目標是 30 分鐘內在可用的 DR Region 恢復完整服務；切回原 Primary Region 屬於後續 Failback。"
        ],
        [
          "RPO 5 分鐘只驗交易時間",
          "交易資料比對是好方法，但還要持續監控 Aurora Global Database 的 replication / RPO lag，並透過 DR 演練證明。"
        ],
        [
          "RTO 驗證只想到 Application 正常與一筆寫入",
          "還要把 DB Promotion、Application、Network、DNS / Endpoint、Secrets / IAM、Health Check、Traffic Switch 與 end-to-end transaction 全部納入計時。"
        ]
      ],
      "memory": [
        "HA ≠ Backup。",
        "Backup ≠ DR。",
        "RPO = 資料最多可落後多少；Lag 是證據。",
        "RTO = 災難後多久恢復服務，不是多久切回原 Region。",
        "RTO 越短，通常需要越多預先部署的 DR 資源。"
      ],
      "archive": "docs/cloud-sa-day13-2026-10-01.md"
    },
    {
      "day": 14,
      "date": "2026-10-02",
      "topic": "DR Strategy / Pilot Light / Warm Standby / Active-Active",
      "score": 78,
      "status": "completed",
      "mastered": [
        "Backup & Restore 適合較寬鬆 RTO / RPO 與成本敏感 workload",
        "Warm Standby 代表 DR Region 有完整但縮小的 Running Application",
        "RTO 越短通常需要越多預先部署的資源",
        "Warm Standby 相較 Active/Active 用較低成本換取較多 Failover / Scale-up 步驟"
      ],
      "corrections": [
        [
          "Q1 選 C Warm Standby，但理由其實描述 Pilot Light",
          "DR Region 沒有 Running EC2 Application，所以應選 Pilot Light；若把縮小版 Application 先 Running 起來才是 Warm Standby。"
        ],
        [
          "System B 同時回答 Pilot Light / Warm Standby",
          "RTO 30 min / RPO 10 min 兩者都有可能，但題目要求做決策時要選一個並用實測 RTO 證明；若想降低達標風險，Warm Standby 較保守。"
        ],
        [
          "Active/Active 說成『無延遲、直接切到另一台』",
          "Active/Active 是多 Region 本來就在服務流量，不是故障後才切到另一台；RTO/RPO 是 near-zero/potentially zero，不應寫絕對零延遲。"
        ],
        [
          "Q3 問 Data 問題，卻列 Compute/Network/Encryption/DNS",
          "真正的 Data 問題應包含 consistency、同筆資料 concurrent write conflict、transaction ordering、replication lag、conflict resolution。"
        ],
        [
          "DNS / Traffic 只寫 ALB",
          "ALB 是 Regional Service；跨 Region traffic failover 應補 Route 53 Failover、Global Accelerator 或 ARC 等 Global Routing。"
        ],
        [
          "RTO 又寫成切回原 Region",
          "RTO 30 min 應驗證 30 分鐘內在大阪恢復完整服務；切回東京是後續 Failback。"
        ],
        [
          "與 Active/Active 比較寫『缺點成本非常昂貴』",
          "Warm Standby 的成本雖不低，但相對 Active/Active 通常較低；真正缺點是 RTO 較長，仍要 Scale Up、Failover、驗證。"
        ]
      ],
      "memory": [
        "Pilot Light = Core/Data on；Application 未必 Running。",
        "Warm Standby = Full App Running but scaled down。",
        "ALB 是 Regional；跨 Region 切流量要 Global Routing。",
        "Active/Active 最難的常常是 Data consistency / conflict。",
        "RTO = 恢復服務，不是 Failback。"
      ],
      "archive": "docs/cloud-sa-day14-2026-10-02.md"
    },
    {
      "day": 15,
      "date": "2026-10-05",
      "topic": "Migration 7 Rs / AWS Transform MGN / AWS DMS Cutover",
      "score": 98,
      "status": "completed",
      "mastered": [
        "短 Deadline + Legacy + Integration 多時，第一階段 Rehost 是合理風險控制策略",
        "Rehost / Replatform / Refactor 能正確配對企業情境",
        "DMS Full Load + CDC 用於降低 Database Migration Cutover 的 downtime / data gap",
        "Cutover 順序：Control Writes → CDC Catch-up → Validate → Switch → Smoke Test → Open Traffic",
        "Phase 1 Migration 與 Phase 2 Modernization 能分階段決策"
      ],
      "corrections": [
        [
          "第二階段『Replatform 不行才全部重構』方向正確，但判斷條件可更精準",
          "不是單純『做不到』才 Refactor；若 Business Goal 需要更高 deployment agility、elasticity、independent scaling、resilience 或解除 monolith coupling，Refactor 可能即使 Replatform 能運作仍值得評估。"
        ],
        [
          "CDC 容易被理解成即時同步",
          "AWS DMS CDC 沒有 real-time / zero-lag 保證；Cutover 前仍要監控 replication latency、停止或控制來源寫入並等 Target catch up。"
        ]
      ],
      "memory": [
        "Rehost = 搬，不太改。",
        "Replatform = 搬 + 有限度平台最佳化。",
        "Refactor = 改架構 / code / operating model。",
        "MGN = Server Rehost。",
        "DMS Full Load + CDC = Database Migration。",
        "Migration 成功 = Cutover + Validation 成功，不只是 Copy 完成。"
      ],
      "archive": "docs/cloud-sa-day15-2026-10-05.md"
    },
    {
      "day": 16,
      "date": "2026-10-06",
      "topic": "Modernization / EC2 vs ECS vs EKS vs Lambda",
      "score": 98,
      "status": "completed",
      "mastered": [
        "能依 Workload、Team Capability、Operational Complexity 與 Portability Requirement 選擇 EC2 / ECS / EKS / Lambda",
        "Dockerized REST API、AWS-only、無 Kubernetes 經驗且希望少管理 Server 時，優先評估 ECS + Fargate",
        "Microservices 不等於一定需要 Kubernetes；ECS 也能承載 Microservices",
        "Legacy OS dependency 且短期不能改程式時，EC2 仍可能是合理選擇",
        "Event-driven、短時間且不規則流量的工作可優先評估 Lambda",
        "Modernization 可採 Containerize + CI/CD、Database Replatform Assessment、Batch Independent Scaling 的漸進策略",
        "公司 Kubernetes Standardized、已有成熟 Platform Team，或 Hybrid / Multi-cloud portability 成為 Requirement 時再重新評估 EKS"
      ],
      "corrections": [
        [
          "把『團隊沒有 Kubernetes 經驗』當成排除 EKS 的唯一理由",
          "更完整的 SA 判斷是：目前沒有足夠的 Kubernetes Requirement 去承擔額外 operational complexity；Team capability 是重要 constraint，但不是唯一因素。"
        ],
        [
          "認為選 EKS 後『成本會變高很多』",
          "EKS 通常增加平台與維運複雜度，也可能提高整體 TCO，但成本不必然大幅高於 ECS/Fargate；仍要比較 workload size、利用率、compute model 與平台人力成本。"
        ],
        [
          "容易把 ECS / EKS 與 Fargate / EC2 視為互斥的同一層選項",
          "ECS / EKS 是 container orchestration 選擇；Fargate / EC2 是 compute 選擇。可有 ECS + Fargate、ECS + EC2、EKS + Fargate、EKS + EC2。"
        ]
      ],
      "memory": [
        "EC2 = VM Control。",
        "ECS = AWS-native Container Orchestration。",
        "EKS = Managed Kubernetes。",
        "Lambda = Event-driven Serverless Compute。",
        "Microservices ≠ Kubernetes。",
        "ECS / EKS = Orchestration；Fargate / EC2 = Compute。",
        "Modernization 的目標不是把架構變複雜，而是用值得的複雜度解決真正的問題。"
      ],
      "archive": "docs/cloud-sa-day16-2026-10-06.md"
    },
    {
      "day": 17,
      "date": "2026-10-07",
      "topic": "Docker & Container / Image → ECR → ECS Task Definition → ECS Service",
      "score": 100,
      "status": "completed",
      "answers": {
        "Q1": "B",
        "Q2": "1→D, 2→E, 3→B, 4→C, 5→A",
        "Q3": "A, B, D",
        "deploymentOrder": "B → D → E → A → C",
        "scaling": "C"
      },
      "mastered": [
        "能區分 Dockerfile、Docker Image、Container、ECR、ECS Task Definition 與 ECS Service 的責任",
        "理解 Container 部署流程：Build Image → Push ECR → Update Task Definition → ECS Service 啟動 Tasks → ALB 導流",
        "Production Image 應使用可識別版本或 immutable digest，避免只依賴 latest",
        "明確 Image Version 有助於追蹤部署版本與 Rollback",
        "ECS Service 負責維持 Desired Count，並可搭配 Service Auto Scaling 因應尖峰流量"
      ],
      "corrections": [],
      "memory": [
        "Dockerfile = Image 建置說明書。",
        "Image = Immutable Application Package；Container = Image 的 Running Instance。",
        "ECR = Image Registry，不負責執行 Container。",
        "Task Definition = ECS 執行規格；Task = 實際 Running Instance。",
        "ECS Service = 維持 Tasks 數量、健康狀態與長期服務。",
        "部署主線：Build → ECR → Task Definition → Service/Task → ALB。",
        "流量尖峰擴縮容主要由 ECS Service Auto Scaling 處理，不是修改 ECR 或 Dockerfile。"
      ],
      "archive": "docs/cloud-sa-day17-2026-10-07.md"
    },
    {
      "day": 18,
      "date": "2026-10-08",
      "topic": "ECS Production Architecture / Health Check / Rolling Deployment / Auto Scaling",
      "score": 90,
      "status": "completed",
      "answers": {
        "Q1": "A",
        "Q2": "1→C, 2→D, 3→A, 4→B",
        "Q3": "A, B, D",
        "deploymentOrder": "C → D → B → A → E",
        "databaseCompatibility": "C"
      },
      "mastered": [
        "理解 minimumHealthyPercent 100% 與 maximumPercent 200% 的部署容量控制",
        "區分 Health Check Grace Period、ALB Target Group Health Check、Service Auto Scaling 與 Deployment Circuit Breaker",
        "認識 Production Health Check 不等於交易端到端成功",
        "能判斷 Database Schema 不相容應停止擴大部署影響並評估相容版本回復"
      ],
      "corrections": [
        [
          "Rolling Deployment 事件順序誤答 C → D → B → A → E",
          "本題邏輯順序為 B → D → A → C → E：更新 Service/Task Definition、啟動新版 Tasks、確認健康、舊版 Draining、完成部署；實際 ECS 啟停可交錯進行。"
        ]
      ],
      "memory": [
        "ECS Service 部署新 Task Definition 後才會啟動新版本 Tasks。",
        "ALB Healthy ≠ Loan Transaction Healthy；必須搭配交易級 Smoke Test。",
        "Rolling Deployment 的 Task 啟停取決於 minimumHealthyPercent、maximumPercent 與健康檢查。",
        "Database Schema Migration 應考慮向前/向後相容與安全 Rollback。"
      ],
      "archive": "docs/cloud-sa-day18-2026-10-08.md"
    },
    {
      "day": 19,
      "date": "2026-10-12",
      "topic": "ECS Application Rollback / Database Schema Compatibility / Expand–Migrate–Contract",
      "score": 90,
      "status": "completed",
      "mastered": [
        "能辨識 ECS 應用程式版本回滾與資料庫 Schema 變更是不同層次的復原問題",
        "理解部署需維持新舊版本與資料庫 Schema 相容，降低 Rolling Deployment 風險",
        "能將 Expand–Migrate–Contract 應用於金融 Loan API 的無停機變更"
      ],
      "corrections": [
        [
          "資料庫 Schema Expansion 與 ECS 新版部署的先後順序",
          "應先部署向後相容的 Schema Expansion，再逐步部署新版 ECS Tasks；資料遷移與舊欄位移除需在確認相容與穩定後進行。"
        ]
      ],
      "memory": [
        "Expand → Migrate → Contract：先擴充相容 Schema，再遷移資料及程式流量，最後移除舊結構。",
        "ECS Application Rollback 不等於 Database Schema Rollback。",
        "Rolling Deployment 期間必須支援新舊版本同時存取資料庫。"
      ],
      "archive": "docs/cloud-sa-day19-2026-10-12.md"
    },
    {
      "day": 20,
      "date": "2026-10-13",
      "topic": "CI/CD / Quality Gates / ECR / Staging / Manual Approval / Production Release",
      "score": 65,
      "status": "completed",
      "answers": {
        "Q1": "B",
        "Q2": "A, C, E",
        "Q3": "1→D, 2→A, 3→C, 4→B",
        "pipelineOrder": "D → A → E → B → F → C → G"
      },
      "mastered": [
        "Critical Vulnerability 應修補或走正式風險例外流程，不直接繞過 Security Gate",
        "Staging 與 Production 應使用相同可追溯 Image Artifact",
        "Manual Approval 不取代自動化測試；Production 必須做交易級驗證"
      ],
      "corrections": [
        [
          "Q3 誤將 Security Gate 與 Manual Approval Gate 對調",
          "正確配對 1→C、2→A、3→D、4→B；Security Gate 根據弱點及政策阻擋，Manual Approval Gate 等待有權限人員核准，Test Gate 負責測試，Production Incident Response 處理上線後事故。"
        ],
        [
          "CI/CD 發布排序誤答 D→A→E→B→F→C→G",
          "本題條件下正確順序 D→A→F→C→B→E→G：建置/單元測試→安全掃描→Staging 驗證→正式變更核准→相容 Schema Expansion→ECS Production 部署→交易 Smoke Test。Schema Expansion 必須早於新應用程式部署。"
        ]
      ],
      "memory": [
        "Staging = 盡可能貼近 Production 的預備發布驗證環境；與 SIT、UAT 目的不同。",
        "ECR = Elastic Container Registry；儲存、管理與掃描 Container Images，不負責執行容器。",
        "Manual Approval = 人工授權發布關卡，不等於自動化資安或品質測試。",
        "Test Gate 問測試是否通過；Security Gate 問是否符合資安政策；Approval Gate 問是否獲授權；Production Verification 問上線後交易是否正常。",
        "ECR 有弱點掃描不代表自動阻止部署；須明確設定 Pipeline Policy Gate。",
        "Expand–Migrate–Contract：先相容 Schema Expansion，再部署新版及遷移，確認安全後才 Contract。"
      ],
      "archive": "docs/cloud-sa-day20-2026-10-13.md"
    },
    {
      "day": 21,
      "date": "2026-10-14",
      "topic": "CI/CD Failure Handling / ECS Rollback / Business Transaction Recovery",
      "score": 90,
      "status": "completed",
      "answers": {
        "Q1": "B",
        "Q2": "1→C, 2→B, 3→D, 4→A",
        "Q3": "C, D, F",
        "practice1": "B",
        "practice2": "C",
        "practice3": "Rollback restores application only; verify DB, configuration, deployment success, main and changed functions."
      },
      "mastered": [
        "正確判斷部署期間 CloudWatch Alarm、ECS Circuit Breaker、Test Gate 與 Manual Approval Gate 的責任",
        "能辨識 Loan Interest Calculation 錯誤屬於 Application Business Logic Failure",
        "知道 Application Rollback 後仍需驗證業務交易、環境設定與服務狀態"
      ],
      "corrections": [
        [
          "Q3 漏選 A：ECS 自動回復的先前成功部署條件",
          "ECS deployment rollback 需要符合條件的先前已成功完成部署；不能假設任何版本都能自動回復。"
        ],
        [
          "誤認只要資料庫新增欄位，Application Rollback 時就應同步 DB 還原",
          "若是向後相容的 nullable Schema Expansion 且舊版可讀寫，通常無須還原 DB；應優先確認相容性，避免破壞性 Schema 回復。"
        ],
        [
          "Application Rollback 後未明確評估已執行交易的業務結果",
          "應區分試算、正式入帳及外部副作用，調查受影響交易、重算/修正資料、保留稽核軌跡；程式回復不會自動修正已產生的錯誤結果。"
        ]
      ],
      "memory": [
        "ECS = AWS 原生 Container Orchestration；負責部署、執行、維持 Tasks、更新與擴縮，不是 Image Registry。",
        "ECS Cluster = 邏輯分組；Task Definition = Image/CPU/Memory/Port 等執行規格；Task = 實際執行個體；Service = 維持 Desired Count 與服務部署。",
        "銀行 Loan API：CodeBuild 建 Image → ECR 儲存 Image → ECS Service 以 Task Definition 在兩 AZ 執行 4 Tasks → ALB 導流 → RDS。",
        "ECS + Fargate 適合 AWS-native 容器化、無 Kubernetes 需求且希望減少主機管理；ECS + EC2 適合需要較多主機控制的情境。",
        "Rollback Application ≠ Rollback DB ≠ Repair Business Transactions；需個別驗證。",
        "跨雲學習建議：AWS 60%、Azure 25%、GCP 15%；以架構需求對照服務，不把 ECS、Azure Container Apps/AKS、Cloud Run/GKE 視為一對一等價。"
      ],
      "archive": "docs/cloud-sa-day21-2026-10-14.md"
    },
    {
      "day": 22,
      "date": "2026-10-15",
      "topic": "Multi-cloud Container Selection / AWS ECS Fargate / Azure Container Apps / GCP Cloud Run / Banking Transaction Recovery",
      "score": 78,
      "status": "completed",
      "answers": {
        "Q1": "B",
        "Q2": "A, F",
        "Q3": "1→B, 2→D, 3→A, 4→C",
        "practice1": "A: ECS + Fargate; B: Cloud Run",
        "practice2": "Multi-AZ + ECS Service Auto Scaling",
        "practice3": "先查 Log 與原因，對已產生交易提出 PITR 回交易前再重跑"
      },
      "mastered": [
        "根據既有 AWS、RDS、CloudWatch 與無 K8s 經驗選擇 ECS + Fargate",
        "能辨識 Cloud Run 對 HTTP 負載自動擴縮的優勢",
        "理解 ECS Task Definition、Service 與 Azure Replica Scaling、GCP Revision 的配對",
        "知道業務異常需先縮小影響範圍，不應立即還原 DB"
      ],
      "corrections": [
        [
          "Q2 漏選 B、C",
          "Azure Container Apps 可依 HTTP/事件規則擴縮；Cloud Run 可能 Scale to Zero，延遲敏感服務需評估 Minimum Instances 與成本。"
        ],
        [
          "實作 2 高可用架構描述不足",
          "ALB + 跨至少兩個 AZ 的 Private ECS Tasks + 健康檢查 + 足夠最小容量 + Service Auto Scaling + RDS Multi-AZ；需評估單 AZ 故障後的剩餘容量。"
        ],
        [
          "實作 3 建議將 DB PITR 回到錯誤交易前再重跑",
          "少量錯誤計息不應預設整庫 PITR，可能倒退大量正常交易；先確認是否僅試算或已入帳、調查流水及影響，按審核流程進行沖正、重算或補正，防重複入帳並對帳。"
        ]
      ],
      "memory": [
        "AWS ECS + Fargate 適合 AWS-native 全天候 Loan API；GCP Cloud Run 適合平時低流量、活動期間尖峰的試算 API，但要評估 Cold Start 與資料庫連線。",
        "Azure Container Apps 支援 HTTP 與事件驅動 Scaling；Cloud Run 可 Scale to Zero，Minimum Instances 可減少 Cold Start 但增加成本。",
        "ECS HA：ALB + 至少兩 AZ ECS Tasks + Health Check + Service Auto Scaling + RDS Multi-AZ，還要確認 AZ 故障後容量。",
        "PITR 不等於業務補正；不要直接還原共用正式 DB 來修少量錯誤利息。",
        "保留全部題目、選項、正解、作答、解析與實務案例，供日後查閱，不只保存錯題。"
      ],
      "archive": "docs/cloud-sa-day22-2026-10-15.md"
    },
    {
      "day": 23,
      "date": "2026-10-16",
      "topic": "Cloud × AI Architecture Review / ECS Rollback / Azure Container Apps Revisions / GCP Cloud Run Traffic / AI Tutor Reliability",
      "score": 58,
      "status": "completed",
      "answers": {
        "Q1": "C",
        "Q2": "1→C、2→A、3→B",
        "Q3": "A, C, E",
        "practice": "Vue 畫面>Spring Boot權限和帳號> Python FastAPI AI Tutor輔助驗證和降級\n\n真的有資料異動 Postgres\n\n新版發生錯誤時要先保留LOG資訊，先將版本回復到穩定版本，恢復完成在依據key值修復資料。"
      },
      "grading": {
        "Q1": {
          "earned": 15,
          "max": 15,
          "correct": "C"
        },
        "Q2": {
          "earned": 0,
          "max": 20,
          "correct": "1→A、2→B、3→C"
        },
        "Q3": {
          "earned": 20,
          "max": 20,
          "correct": "A、C、E"
        },
        "practice": {
          "earned": 23,
          "max": 45
        }
      },
      "mastered": [
        "辨識業務錯誤不能只靠 Health Check，應控制影響並調查交易",
        "知道測試資料應使用合成或授權去識別資料",
        "AI Tutor 與正式業務服務分離、保留模型/Prompt/Request ID",
        "事故保留 Log、恢復穩定版本、以 Key 追查影響資料"
      ],
      "corrections": [
        [
          "Q2 三項跨雲發布機制配對錯誤",
          "正確：AWS ECS → Deployment Circuit Breaker；Azure Container Apps → Multiple Revisions + Traffic Weights；GCP Cloud Run → Revision Tags + Traffic Migration。"
        ],
        [
          "實作未具體說明 AI Timeout 降級",
          "Spring Boot 呼叫 FastAPI 應設 Timeout、錯誤處理與降級，回退固定教材或非 AI 練習，核心考試/登入不依賴 AI 可用性。"
        ],
        [
          "實作未明確保護正式成績寫入權限",
          "AI Tutor 不得直接覆寫正式成績；Spring Boot 依 Auth/RBAC、既有評分規則與稽核流程寫 Postgres。"
        ],
        [
          "實作資料修復需加上影響範圍與審核",
          "保留 Request ID/版本與必要 Log，查明受影響紀錄後經核准修復與驗證，不預設整庫 PITR 或單純重跑。"
        ]
      ],
      "memory": [
        "ECS Deployment Circuit Breaker、Azure Container Apps Traffic Weights、Cloud Run Revision Tags/Traffic Migration：服務相似但並非一對一等價。",
        "Cloud SA Academy：Vue → Spring Boot（Auth/RBAC）→ FastAPI AI Tutor；正式成績寫入由 Spring Boot 授權控制。",
        "AI Timeout 降級到固定教材/非 AI 練習；保留 Request ID、模型/Prompt/Deployment 版本，避免 AI 失效影響核心功能。",
        "Application Rollback 不會自動修正既有錯誤業務資料；依 Key、稽核紀錄及審核流程補正。"
      ],
      "archive": "docs/cloud-ai-day23-2026-10-16.md"
    }
  ],
  "cloudComparison": {
    "title": "AWS / Azure / GCP 服務並排對照",
    "note": "依架構能力比較；名稱相近不代表部署模型、權限、網路或 SLA 完全等價。",
    "updatedAt": "2026-10-15",
    "mappedTerms": 27
  },
  "archivePolicy": {
    "version": 1,
    "scope": "Day 1–22",
    "historicalDays": "Day 1–21：依現存紀錄補檔，部分原始題目與作答無法核實，不冒充原題",
    "fullArchiveFrom": "Day 22",
    "rule": "保留每日完整原題、選項、使用者答案、正解、解析、實作、錯題；缺漏明示"
  }
};
