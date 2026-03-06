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
-- Table structure for table `daily_updates`
--

DROP TABLE IF EXISTS `daily_updates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `daily_updates` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `task_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `date` date DEFAULT NULL,
  `units_completed` int DEFAULT NULL,
  `hours_spent` int DEFAULT NULL,
  `project_id` int DEFAULT NULL,
  `role` varchar(100) DEFAULT NULL,
  `task_name` varchar(255) DEFAULT NULL,
  `remarks` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `daily_updates`
--

LOCK TABLES `daily_updates` WRITE;
/*!40000 ALTER TABLE `daily_updates` DISABLE KEYS */;
INSERT INTO `daily_updates` VALUES (6,1,NULL,'2026-02-18',1,1,NULL,NULL,NULL,NULL),(7,1,NULL,'2026-02-16',1,1,NULL,NULL,NULL,NULL),(15,NULL,1,'2026-02-19',2,2,1,'BA','BA-BRD','None'),(17,NULL,2,'2026-02-27',2,2,1,'FE Dev','FEDev-API Design','none'),(18,NULL,2,'2026-02-27',4,6,1,'BA','BA-BRD','none');
/*!40000 ALTER TABLE `daily_updates` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-05 15:45:54
