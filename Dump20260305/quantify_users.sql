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
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` text,
  `role` varchar(20) DEFAULT NULL,
  `daily_capacity` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Admin User','admin@test.com','$2b$10$vOJIzK0PpGd4/hs0mQeLB.XhrzewQYg8aXoFYZVhMLh6UQGiC4oNS','ADMIN',8),(2,'Emp User','emp@test.com','$2b$10$equgRb/vnViDptQWqUHVE.bhK865zQKW8NU8J/vtx4HONHsuZkxE.','EMP',8),(30,'Admin User','admin@workquantify.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSc/Btr.2','ADMIN',8),(31,'Ms. Nanditha A P','nanditha.p@workquantify.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSc/Btr.2','EMP',8),(32,'Ms. Kusum G G','kusum.g@workquantify.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSc/Btr.2','EMP',8),(33,'Mr. Tanguturu Vinay Kumar','tanguturu.kumar@workquantify.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSc/Btr.2','EMP',8),(34,'Mr. Rushil Prasad K S','rushil.s@workquantify.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSc/Btr.2','EMP',8),(35,'Ms. Pallavi G K','pallavi.k@workquantify.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSc/Btr.2','EMP',8),(36,'Mr. Siddesh D R','siddesh.r@workquantify.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSc/Btr.2','EMP',8),(37,'Mr. Swaroop Singh R','swaroop.r@workquantify.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSc/Btr.2','EMP',8),(38,'Ms. Kanaka C S','kanaka.s@workquantify.com','$2b$10$equgRb/vnViDptQWqUHVE.bhK865zQKW8NU8J/vtx4HONHsuZkxE.','EMP',8),(39,'Mr. Veeranna Bedasur','veeranna.bedasur@workquantify.com','$2b$10$equgRb/vnViDptQWqUHVE.bhK865zQKW8NU8J/vtx4HONHsuZkxE.','EMP',8),(40,'Ms. Nivetha Jayagopal','nivetha.jayagopal@workquantify.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSc/Btr.2','EMP',8),(41,'Mr. Yusuf Mohammed','yusuf.mohammed@workquantify.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSc/Btr.2','EMP',8),(42,'Ms. Kumari T R','kumari.r@workquantify.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSc/Btr.2','EMP',8),(43,'Mr. Anirudh A','anirudh.a@workquantify.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSc/Btr.2','EMP',8),(44,'Mr. Salmansab I Gulgundi','salmansab.gulgundi@workquantify.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSc/Btr.2','EMP',8),(45,'Mr. Amogh K Sharma','amogh.sharma@workquantify.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSc/Btr.2','EMP',8),(46,'Ms. Swetha Shree H N','swetha.n@workquantify.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSc/Btr.2','EMP',8),(47,'Mr. Nithin G S','nithin.s@workquantify.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSc/Btr.2','EMP',8),(48,'Mr. Navithkumar Vijayan','navithkumar.vijayan@workquantify.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSc/Btr.2','EMP',8),(49,'Mr. Sutanu Sui','sutanu.sui@workquantify.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSc/Btr.2','EMP',8),(50,'Mr. Ankith','ankith.user@workquantify.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSc/Btr.2','EMP',8),(51,'Ms. Soumya','soumya.user@workquantify.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSc/Btr.2','EMP',8),(52,'Mr. Amal','amal.user@workquantify.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSc/Btr.2','EMP',8);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
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
