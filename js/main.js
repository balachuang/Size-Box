var currCategory = null;
var objectArray = null;
var targetObj = null;

$(document).ready(initDocument);

function initDocument()
{
    prepareObjectsAndSelector();
    resizeContainers();

    $(window ).resize(resizeContainers);
    $(document).on('mouseenter', '.object', displayObjectInfo);
    $(document).on('mouseleave', '.object', hideObjectInfo);

    $('#add-object').click(addObject);
    $('#change-category').click(changeCategory);
    $(document).on('click', '.object-delete', delObject);
    $(document).on('click', '.object-change', changeObject);

    $('#object-progress-bar').mousewheel(function(event, delta) {
        this.scrollLeft -= (delta * 30);
        event.preventDefault();
    });
}

// resize all contains and objects
function resizeContainers()
{
    $('#main-container').css({
        'left' : 10,
        'top' : 10,
        'width' : $(document).width() - 20,
        'height' : $(document).height() - 20
    });
    $('#y-axis').css({
        'left' : 0,
        'top' : 0,
        'width' : 50,
        'height' : $('#main-container').height() - 50
    });
    $('#x-axis').css({
        'left' : 0,
        'top' : $('#main-container').height() - 50,
        'height' : 50
    });
    $('#x-axis').width($('#main-container').width());
    $('#object-container').css({
        'left' : 50,
        'top' : 0,
        'height' : $('#main-container').height() - 50
    });
    $('#object-progress-bar').css({
        'left' : 0,
        'top' : 0,
        'height' : $('#main-container').height()
    });
    $('#object-container').width($('#main-container').width() - 50);
    $('#object-progress-bar').width($('#object-container').width());

    resizeObjects();
}

// resizing and relocation all objects.
// recursively call resizeObject to perform animation
function resizeObjects()
{
    $('.object-delete').hide();
    $('.object-change').hide();

    var maxHeight = 0;
    for (var n=0; n<$('.object').length; ++n)
    {
        var thisObj = $('.object').eq(n);
        var h = eval(thisObj.attr('obj-height'));
        if (maxHeight < h) maxHeight = h;
    }

    resizeObject(0, 10, maxHeight);
}

function resizeObject(idx, curLeft, maxHeight)
{
    if (idx >= $('.object').length) return;

    var thisObj = $('.object').eq(idx);
    var h = eval(thisObj.attr('obj-height'));
    h = $('#object-container').height() * h / maxHeight;
    if (thisObj.hasClass('control')) {
        thisObj.animate({
            'left' : curLeft,
            'top' : $('#object-container').height() - $('#add-object').height()
        }, 200, function(){
            resizeObject(idx + 1, curLeft + thisObj.width() + 10, maxHeight);
        });
    }else{
        thisObj.animate({
            left : curLeft,
            top : $('#object-container').height() - h,
            opacity: 1.0
        }, 200, function(){
            thisObj.find('.object-image').animate({height:h}, 200, function(){
                resizeObject(idx + 1, curLeft + thisObj.width() + 10, maxHeight);
            });
        });
    }
}

// add a new object
function addObject()
{
    // read default object information
    var obj = readObjectInformation(-1);

    // visualize object
    var newObj = $('#add-object').before(
        '<div class="object" name="' + obj.name + '" obj-height="' + obj.height + '" style="opacity:0;">' +
        '   <img class="object-image" src="' + obj.image + '">' +
        '   <div class="object-name">' + obj.name + '</div>' +
        '   <div class="object-description">' + obj.description + '</div>' +
        '   <div class="object-delete"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></div>' +
        '   <div class="object-change"><span class="glyphicon glyphicon-th-large" aria-hidden="true"></span></div>' +
        '</div>'
    );
    resizeObjects();
}

// delete an object
function delObject()
{
    $(this).closest('div.object').remove();
    resizeObjects();
}

// change the object contain
// call updateObject to re-render object
function changeObject()
{
    targetObj = $(this).closest('div.object');
    $('#obj-selector').hide().css({
        top: $(this).offset().top,
        left: $(this).offset().left + 30
    }).show();
}

function updateObject(idx)
{
    $('#obj-selector').hide();

    // read default object information
    var obj = readObjectInformation(idx);

    // visualize object
    targetObj.attr('obj-height', obj.height);
    targetObj.find('div.object-name').text(obj.name);
    targetObj.find('div.object-description').text(obj.description);
    targetObj.find('img.object-image').attr('src', obj.image);
    targetObj = null;

    //targetObj.find('img.object-image').load(resizeObjects);
    resizeObjects();
}

// return object information by index
function readObjectInformation(idx)
{
    if (idx >= 0)
    {
        if (objectArray == null) return null;
        return objectArray[idx];
    }else{
        // return the cirst object of current category
    }
    for (var n=0; n<objectArray.length; ++n)
    {
        if (objectArray[n].category == currCategory) return objectArray[n];
    }
    return null;
}

// show object information when mouse over
function displayObjectInfo()
{
    $(this).find('.object-delete').css({
        top: 10,
        left: $(this).width() - 30
    }).show();
    $(this).find('.object-change').css({
        top: 10,
        left: 10
    }).show();
}

// show object information when mouse out
function hideObjectInfo()
{
    $(this).find('.object-delete').hide();
    $(this).find('.object-change').hide();
    // $('#obj-selector').hide();
    // $('#cat-selector').hide();
}

function changeCategory()
{
    $('#cat-selector').hide().css({
        top: $('#change-category').offset().top - $('#cat-selector').height(),
        left: $('#change-category').offset().left + $('#change-category').width() + 10
    }).show();
}

function updateCategory(catName)
{
    $('#cat-selector').hide();
    currCategory = catName;
    prepareObjSelector();
    $('.object:not(".control")').remove();
    resizeObjects();
}

// read all object information from properties file
// call prepareSelector to prepare selector for changeObject
function prepareObjectsAndSelector()
{
    var userLang = navigator.language || navigator.userLanguage;
    // read by current browser language, then read default if fail
    $.get('objects_' + userLang + '.properties', parsePropertyFile).fail(function(){
        $.get( "objects.properties", parsePropertyFile);
    });
}

function parsePropertyFile(data)
{
    var objFolder = 'objImages/';
    var lines = data.split('\n');

    var obj = null;
    objectArray = new Array();
    for (var n=0; n<lines.length; ++n)
    {
        var thisLine = $.trim(lines[n]);
        if (thisLine == '## object start') {
            if (obj != null) objectArray.push(obj);
            obj = {'category': '', 'name': '', 'description': '', 'height': 0, 'image': ''};
        }else if (thisLine != '') {
            if (thisLine.startsWith('#')) continue;
            var kv = thisLine.split('=');
            if (kv.length != 2) continue;
            switch($.trim(kv[0]))
            {
                case 'obj_category':
                    obj.category = $.trim(kv[1]);
                    if (currCategory == null) currCategory = obj.category;
                    break;
                case 'obj_name':
                    obj.name = $.trim(kv[1]);
                    break;
                case 'obj_description':
                    obj.description = $.trim(kv[1]);
                    break;
                case 'obj_height':
                    obj.height = eval($.trim(kv[1]));
                    break;
                case 'obj_image':
                    obj.image = objFolder + $.trim(kv[1]);
                    break;
            }
        }
    }
    if (obj != null) objectArray.push(obj);
    prepareObjSelector();
    prepareCatSelector();
}

function prepareObjSelector()
{
    $('#obj-selector').remove();

    var objSelector = '<div id="obj-selector">';
    for (var n=0; n<objectArray.length; ++n) {
        var obj = objectArray[n];
        if (obj.category != currCategory) continue;
        objSelector += '<div><a role="menuitem" tabindex="-1" href="javascript:updateObject('+n+')">' + obj.name + '</a></div>';
    }
    objSelector += '</div>';
    $(objSelector).hide().appendTo('body');
}

function prepareCatSelector()
{
    $('#cat-selector').remove();

    var cats = new Array();
    for (var n=0; n<objectArray.length; ++n) {
        var obj = objectArray[n];
        if (cats.indexOf(obj.category) < 0) cats.push(obj.category);
    }
    cats.sort();

    var catSelector = '<div id="cat-selector">';
    for (var n=0; n<cats.length; ++n) {
        catSelector += '<div><a role="menuitem" tabindex="-1" href="javascript:updateCategory(\''+cats[n]+'\')">' + cats[n] + '</a></div>';
    }
    catSelector += '</div>';
    $(catSelector).hide().appendTo('body');
}
