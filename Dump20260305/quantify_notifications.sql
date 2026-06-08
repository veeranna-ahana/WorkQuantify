-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: quantify
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `type` varchar(50) NOT NULL DEFAULT 'info',
  `title` varchar(150) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user_read` (`user_id`,`is_read`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,2,'assignment_created','New assignment on ERP','You have been assigned 100 unit(s) of \"BEDev-API Implementation\" (BE Dev) on project \"ERP\".',1,'2026-03-02 06:57:11'),(2,2,'assignment_created','New assignment on ERP','You have been assigned 15 unit(s) of \"FEDev-UI Implementation\" (FE Dev) on project \"ERP\".',1,'2026-03-02 07:27:41'),(3,39,'assignment_created','New assignment on ERP','You have been assigned 10 unit(s) of \"BEDev-DB Design\" (BE Dev) on \"ERP\".',1,'2026-03-02 08:32:01'),(4,36,'assignment_created','New assignment on ERP','You have been assigned 10 unit(s) of \"BEDev-DB Design\" (BE Dev) on \"ERP\".',0,'2026-03-02 08:32:15'),(5,39,'assignment_created','New assignment on ERP','You have been assigned 51 unit(s) of \"BEDev-API Impl\" (BE Dev) on \"ERP\".',1,'2026-03-02 10:41:31'),(6,39,'assignment_created','New assignment on ERP','You have been assigned 50 unit(s) of \"BEDev-API Impl\" (BE Dev) on \"ERP\".',1,'2026-03-02 10:42:31'),(7,39,'assignment_created','New assignment on ERP','You have been assigned 1 unit(s) of \"BA-BRD\" (BA) on \"ERP\".',0,'2026-03-06 06:34:27'),(8,38,'assignment_created','New assignment on ERP','You have been assigned 1 unit(s) of \"BA-TDD\" (BA) on \"ERP\".',1,'2026-03-10 05:31:55'),(9,39,'assignment_created','New assignment on ERP','You have been assigned 100 unit(s) of \"BEDev-API Testing\" (BE Dev) on \"ERP\".',0,'2026-03-10 05:43:19'),(10,38,'assignment_created','New assignment on ERP','You have been assigned 100 unit(s) of \"BEDev-API Testing\" (BE Dev) on \"ERP\".',1,'2026-03-10 05:47:16'),(11,1,'progress_pending','Progress update awaiting approval','Ms. Kanaka C S logged 50 unit(s) of \"BEDev-API Testing\" (BE Dev) on \"ERP\". Awaiting your approval.',1,'2026-03-10 06:12:49'),(12,30,'progress_pending','Progress update awaiting approval','Ms. Kanaka C S logged 50 unit(s) of \"BEDev-API Testing\" (BE Dev) on \"ERP\". Awaiting your approval.',0,'2026-03-10 06:12:49'),(13,1,'progress_pending','Progress update awaiting approval','Ms. Kanaka C S logged 1 unit(s) of \"BA-TDD\" (BA) on \"ERP\". Awaiting your approval.',1,'2026-03-10 06:12:59'),(14,30,'progress_pending','Progress update awaiting approval','Ms. Kanaka C S logged 1 unit(s) of \"BA-TDD\" (BA) on \"ERP\". Awaiting your approval.',0,'2026-03-10 06:12:59'),(15,38,'progress_approved','Progress approved ✓','Your log of 50 unit(s) for \"BEDev-API Testing\" (BE Dev) on \"ERP\" has been approved.',1,'2026-03-10 06:17:49'),(16,38,'progress_rejected','Progress update rejected','Your log of 1 unit(s) for \"BA-TDD\" on \"ERP\" was rejected. Reason: recheck and raise againe',1,'2026-03-10 06:18:45'),(17,1,'progress_pending','Progress update awaiting approval','Ms. Kanaka C S logged 1 unit(s) of \"BA-TDD\" (BA) on \"ERP\". Awaiting your approval.',1,'2026-03-10 06:19:14'),(18,30,'progress_pending','Progress update awaiting approval','Ms. Kanaka C S logged 1 unit(s) of \"BA-TDD\" (BA) on \"ERP\". Awaiting your approval.',0,'2026-03-10 06:19:14'),(19,38,'progress_approved','Progress approved ✓','Your log of 1 unit(s) for \"BA-TDD\" (BA) on \"ERP\" has been approved.',1,'2026-03-10 06:19:25'),(20,38,'assignment_created','New assignment on ERP','You have been assigned 1 unit(s) of \"BA-Requirements Sign Off\" (BA) on \"ERP\".',1,'2026-04-01 05:58:25'),(21,1,'progress_pending','Progress update awaiting approval','Ms. Kanaka C S logged 1 unit(s) of \"BA-Requirements Sign Off\" (BA) on \"ERP\". Awaiting your approval.',1,'2026-04-01 05:59:03'),(22,30,'progress_pending','Progress update awaiting approval','Ms. Kanaka C S logged 1 unit(s) of \"BA-Requirements Sign Off\" (BA) on \"ERP\". Awaiting your approval.',0,'2026-04-01 05:59:03'),(23,38,'progress_approved','Progress approved ✓','Your log of 1 unit(s) for \"BA-Requirements Sign Off\" (BA) on \"ERP\" has been approved.',0,'2026-04-01 05:59:18'),(24,32,'assignment_created','New assignment on API Integration','You have been assigned 4 unit(s) of \"BA-BRD\" (BA) on \"API Integration\".',0,'2026-04-08 05:33:17'),(25,42,'assignment_created','New assignment on ERP','You have been assigned 10 unit(s) of \"BEDev-Documentation\" (BE Dev) on \"ERP\".',0,'2026-04-09 02:56:55'),(26,1,'progress_pending','Progress update awaiting approval','Emp User logged 2 unit(s) of \"BEDev-API Testing\" (BE Dev) on \"Alpha\". Awaiting your approval.',1,'2026-04-09 04:12:25'),(27,30,'progress_pending','Progress update awaiting approval','Emp User logged 2 unit(s) of \"BEDev-API Testing\" (BE Dev) on \"Alpha\". Awaiting your approval.',0,'2026-04-09 04:12:25'),(28,39,'assignment_created','New assignment on Alpha','You have been assigned 100 unit(s) of \"BEDev-API Impl\" (BE Dev) on \"Alpha\".',0,'2026-05-11 10:25:06'),(29,2,'assignment_created','New assignment on Alpha','You have been assigned 100 unit(s) of \"BEDev-API Impl\" (BE Dev) on \"Alpha\".',1,'2026-05-11 10:26:01'),(30,1,'progress_pending','Progress update awaiting approval','Emp User logged 50 unit(s) of \"BEDev-API Impl\" (BE Dev) on \"Alpha\". Awaiting your approval.',1,'2026-05-11 10:27:08'),(31,30,'progress_pending','Progress update awaiting approval','Emp User logged 50 unit(s) of \"BEDev-API Impl\" (BE Dev) on \"Alpha\". Awaiting your approval.',0,'2026-05-11 10:27:08'),(32,2,'progress_approved','Progress approved ✓','Your log of 50 unit(s) for \"BEDev-API Impl\" (BE Dev) on \"Alpha\" has been approved.',0,'2026-05-11 10:27:34'),(33,1,'progress_pending','Progress update awaiting approval','Emp User logged 50 unit(s) of \"BEDev-API Impl\" (BE Dev) on \"Alpha\". Awaiting your approval.',1,'2026-05-11 10:38:36'),(34,30,'progress_pending','Progress update awaiting approval','Emp User logged 50 unit(s) of \"BEDev-API Impl\" (BE Dev) on \"Alpha\". Awaiting your approval.',0,'2026-05-11 10:38:36'),(35,2,'progress_approved','Progress approved ✓','Your log of 2 unit(s) for \"BEDev-API Testing\" (BE Dev) on \"Alpha\" has been approved.',0,'2026-05-11 11:44:43'),(36,43,'assignment_created','New assignment on PMS Portal','You have been assigned 1 unit(s) of \"BA-Requirements Sign Off\" (BA) on \"PMS Portal\".',0,'2026-06-08 06:49:10'),(37,2,'assignment_created','New assignment on PMS Portal','You have been assigned 5 unit(s) of \"BA-TDD\" (BA) on \"PMS Portal\".',0,'2026-06-08 06:49:38');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-08 13:11:30
