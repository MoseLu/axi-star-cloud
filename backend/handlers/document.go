package handlers

import (
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"backend/database"
	"backend/models"
	"backend/utils"

	"github.com/gin-gonic/gin"
)

// DocumentHandler 文档处理器
type DocumentHandler struct {
	docRepo *database.DocumentRepository
}

// NewDocumentHandler 创建文档处理器实例
func NewDocumentHandler(docRepo *database.DocumentRepository) *DocumentHandler {
	return &DocumentHandler{
		docRepo: docRepo,
	}
}

// GetDocuments 获取所有文档
func (h *DocumentHandler) GetDocuments(c *gin.Context) {
	documents, err := h.docRepo.GetDocuments()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取文档列表失败"})
		return
	}

	response := models.DocumentListResponse{
		Success:   true,
		Documents: documents,
	}
	c.JSON(http.StatusOK, response)
}

// CreateDocument 创建文档
func (h *DocumentHandler) CreateDocument(c *gin.Context) {
	// 获取表单数据
	title := c.PostForm("title")
	category := c.PostForm("category")
	orderStr := c.PostForm("order")

	// 验证必填字段
	if title == "" || category == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "标题和分类为必填项"})
		return
	}

	// 解析order字段
	order := 0
	if orderStr != "" {
		if parsedOrder, err := strconv.Atoi(orderStr); err == nil {
			order = parsedOrder
		}
	}

	// 获取上传的文件
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请选择要上传的Markdown文件"})
		return
	}
	defer file.Close()

	// 检查文件扩展名
	if !strings.HasSuffix(strings.ToLower(header.Filename), ".md") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "只支持上传.md格式的文件"})
		return
	}

	// 创建md目录
	mdDir := utils.GetFileUploadDir("md")
	if err := os.MkdirAll(mdDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建目录失败"})
		return
	}

	// 检查文件是否已存在
	filePath := filepath.Join(mdDir, header.Filename)
	if _, err := os.Stat(filePath); err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "文件已存在，请使用不同的文件名"})
		return
	}

	// 保存文件
	dst, err := os.Create(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "保存文件失败"})
		return
	}
	defer dst.Close()

	// 读取原始文件内容
	originalContent, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "读取文件失败"})
		return
	}

	// 构建frontmatter
	frontmatter := "---\n"
	frontmatter += "title: " + title + "\n"
	frontmatter += "category: " + category + "\n"
	frontmatter += "order: " + strconv.Itoa(order) + "\n"
	frontmatter += "---\n\n"

	// 组合新内容
	newContent := frontmatter + string(originalContent)

	// 写入文件
	_, err = dst.WriteString(newContent)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "写入文件失败"})
		return
	}

	// 创建文档记录
	doc := &models.Document{
		Title:    title,
		Category: category,
		Order:    order,
		Filename: header.Filename,
		Path:     "/uploads/md/" + header.Filename,
	}

	if err := h.docRepo.CreateDocument(doc); err != nil {
		if err.Error() == "文档已存在" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "文档已存在，请使用不同的标题或分类"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "创建文档记录失败"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"message":  "文档同步成功",
		"document": doc,
	})
}

// GetDocument 获取单个文档
func (h *DocumentHandler) GetDocument(c *gin.Context) {
	docIDStr := c.Param("id")
	docID, err := strconv.Atoi(docIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的文档ID"})
		return
	}

	doc, err := h.docRepo.GetDocumentByID(docID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "文档不存在"})
		return
	}

	response := models.DocumentResponse{
		Success:  true,
		Document: *doc,
	}
	c.JSON(http.StatusOK, response)
}

// DeleteDocument 删除文档
func (h *DocumentHandler) DeleteDocument(c *gin.Context) {
	docIDStr := c.Param("id")
	docID, err := strconv.Atoi(docIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的文档ID"})
		return
	}

	// 获取文档信息
	doc, err := h.docRepo.GetDocumentByID(docID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "文档不存在"})
		return
	}

	// 删除文件
	filePath := utils.GetFileAbsolutePath(doc.Path)
	if err := os.Remove(filePath); err != nil && !os.IsNotExist(err) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除文件失败"})
		return
	}

	// 删除数据库记录
	if err := h.docRepo.DeleteDocument(docID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除文档记录失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "文档删除成功",
	})
}
