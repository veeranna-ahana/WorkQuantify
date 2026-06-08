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
-- Table structure for table `role_task_catalog`
--

DROP TABLE IF EXISTS `role_task_catalog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_task_catalog` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `role` varchar(100) NOT NULL,
  `task_name` varchar(255) NOT NULL,
  `unit_type` varchar(150) NOT NULL,
  `notes` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_role_task` (`role`,`task_name`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_task_catalog`
--

LOCK TABLES `role_task_catalog` WRITE;
/*!40000 ALTER TABLE `role_task_catalog` DISABLE KEYS */;
INSERT INTO `role_task_catalog` VALUES (1,'BA','BA-BRD','UserStories','1 unit = 1 approved section'),(2,'BA','BA-TDD','UserStories','Can align with BRD sections'),(3,'BA','BA-Requirements Sign Off','Documents','1 unit = 1 requirement'),(4,'UI','UI design/ Figma','Screens','Primary unit'),(5,'UI','UI Review','Screens','Review effort'),(6,'UI','UI Signoff','Screens','Milestone unit'),(7,'TL','TL-Code review','PR\'s','1 unit=1 PR'),(8,'TL','TL-Unit Testing','Test cases','Can link to dev test cases'),(9,'TL','TL-Assign Task','Tasks','Lightweight effort'),(10,'TL','TL-Peer code merge','Merges','1 unit = 1 merge'),(11,'FE Dev','FEDev-UI Impl','Screens','Screen count'),(12,'FE Dev','FEDev-API Design','APIs','API count'),(13,'FE Dev','FEDev-API Impl','APIs','API count'),(14,'FE Dev','FEDev-API Integration','APIs','API count'),(15,'BE Dev','BEDev-DB Design','DB/Tables','1 object = 1 unit'),(16,'BE Dev','BEDev-API Impl','APIs','API count'),(17,'BE Dev','BEDev-API Testing','APIs','API count'),(18,'BE Dev','BEDev-UI Testing','Screens','Screen count'),(19,'BE Dev','BEDev-Documentation','Documentes','Pages'),(20,'BE Dev','BEDev-Design Review','Modules','Component count'),(21,'BE Dev','BEDev-Code Review','PRs','PR count'),(22,'BE Dev','BEDev-Release  notes for each build','Release','Per build'),(23,'FE Dev','Mobile API Integration','APIs ','API count'),(24,'Tester','UAT testing','Test cases','Core QA metric'),(25,'Tester','Test cases doc preparation','Test cases','Creation effort'),(26,'Tester','Intergration testing','Test scenarios','Scenario-based'),(27,'Tester','Fault tracker','Defects','Bug Count'),(28,'Tester','Traceability Matrix','Features','Req ↔ Test mappings'),(29,'Tester','Aging Report','Defects','Per report'),(30,'Tester','QA Sign off','Modules','Milestone unit'),(31,'Tester','User manual preparation','Modules','Documentation effort');
/*!40000 ALTER TABLE `role_task_catalog` ENABLE KEYS */;
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
