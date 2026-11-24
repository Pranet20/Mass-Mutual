# Known Technical Limitations & Operational Prerequisites

1. **Microsoft Power BI Cloud Service Embed Token Licensing**:
   - Generating automated embed tokens via Microsoft Entra ID requires an active Microsoft Fabric capacity, Power BI Premium (P SKU) or Power BI Embedded (A/EM SKU) workspace assignment.
   - For standard organizational users, the pre-authored `Corporate_Travel_Analytics.pbix` master file or PBIP project may be opened directly in Power BI Desktop or published to a standard Power BI Pro workspace with zero cost.

2. **Database Ingestion Mode**:
   - The ingestion pipeline processes daily batch CSV files with SHA-256 idempotency. Real-time sub-second streaming ingestion (e.g., Apache Kafka / AWS Kinesis) is out of scope per PS-04 specifications.

3. **In-Memory Rate Limiting**:
   - The default sliding-window rate limiter runs in-memory per worker process. For multi-node distributed deployments across dozens of Kubernetes pods, configuring a shared Redis instance is recommended.
